import {combineReducers} from 'redux';
import undoable, {excludeAction} from 'redux-undo';

import {ADD_BOX, SELECT_BOX, MOVE_BOX, RESIZE_BOX, UPDATE_BOX, DELETE_BOX, REORDER_BOX, ADD_SORTABLE_CONTAINER,
    ADD_NAV_ITEM, SELECT_NAV_ITEM, EXPAND_NAV_ITEM, REMOVE_NAV_ITEM, REORDER_NAV_ITEM,
    TOGGLE_PLUGIN_MODAL, TOGGLE_PAGE_MODAL, TOGGLE_TEXT_EDITOR, TOGGLE_TITLE_MODE,
    CHANGE_DISPLAY_MODE, SET_BUSY, UPDATE_TOOLBAR, IMPORT_STATE
} from './actions';
import {ID_PREFIX_SECTION, ID_PREFIX_PAGE, ID_PREFIX_SORTABLE_BOX, ID_PREFIX_SORTABLE_CONTAINER} from './constants';

function boxCreator(state = {}, action = {}){
    switch (action.type){
        case ADD_BOX:
            /*
            let styleStr = "min-width: '100px'; min-height: '100px'; background-color: 'yellow'".split(';');
            let style = {};
            styleStr.forEach(item =>{
                let keyValue = item.split(':');
                //We camelCase style keys
                let key = keyValue[0].trim().replace(/-./g,function(char){return char.toUpperCase()[1]});
                style[key] = keyValue[1].trim().replace(/'/g, "");
            });
            */
            let content = action.payload.content;
            if(!content)
                content = "<h1>Placeholder</h1>";

            let position, width, height;
            switch(action.payload.type){
                case 'sortable':
                    position = {x: 0, y: 0};
                    width = '100%';
                    break;
                default:
                    position = {x: Math.floor(Math.random() * 500), y: Math.floor(Math.random() * 500)}
                    width = 200;
                    height = 200;
                    break;
            }
            if(action.payload.ids.parent.indexOf(ID_PREFIX_SORTABLE_BOX) !== -1){
                position.x = 0;
                position.y = 0;
                width = '100%';
            }
            
            return {
                id: action.payload.ids.id,
                children: [],
                parent: action.payload.ids.parent,
                container: action.payload.ids.container,
                type: action.payload.type,
                position: position,
                width: width,
                height: height,
                content: content,
                draggable: action.payload.draggable,
                resizable: action.payload.resizable,
                showTextEditor: false,
                fragment: {},
                sortableContainers: {}
            };
        default:
            return state;
    }
}

function sortableContainerCreator(state = {}, action = {}, boxes = []){
    let container;
    switch (action.type){
        case ADD_BOX:
            return Object.assign({}, state, {
                [action.payload.ids.container]: (state[action.payload.ids.container] ? {
                    children: [...state[action.payload.ids.container].children, action.payload.ids.id],
                    height: calculateNewSortableContainerHeight(state[action.payload.ids.container].height, boxes)
                } : {
                    children: [action.payload.ids.id],
                    height: calculateNewSortableContainerHeight(0, boxes)
                })
            });
        case MOVE_BOX:
            container = boxes[action.payload.id].container;
            return Object.assign({}, state, {
                [container]: Object.assign({}, state[container], {
                    height: calculateNewSortableContainerHeight(state[container].height, boxes, action, state[container].children)
                })
            });
        case RESIZE_BOX:
            container = boxes[action.payload.id].container;
            return Object.assign({}, state, {
                [container]: Object.assign({}, state[container], {
                    height: calculateNewSortableContainerHeight(state[container].height, boxes, action, state[container].children)
                })
            });
        case DELETE_BOX:
            container = boxes[action.payload.id].container;
            let newState = Object.assign({}, state);
            if(state[container].children.length === 1){
                delete newState[container];
                return newState;
            }
            let newChildren = state[container].children.filter(id => id !== action.payload.id);
            return Object.assign({}, state, {
                [container]: Object.assign({}, state[container], {
                    children: newChildren,
                    height: calculateNewSortableContainerHeight(state[container].height, boxes, action, newChildren)
                })
            })
        default:
            return state;
    }
}

function calculateNewSortableContainerHeight(actualHeight, boxes, action, boxesToCheck){
    let newHeight = 0;
    if(!action){
        newHeight = boxes[0].position.y + boxes[0].height;
        return (newHeight > actualHeight) ? newHeight : actualHeight;
    }
    boxesToCheck.map(id => {
        let h;
        if(id === action.payload.id){
            if(action.payload.y){
                h = action.payload.y + boxes[id].height;
            }else if (action.payload.height){
                h = boxes[id].position.y + action.payload.height;
            }else{
                h = boxes[id].position.y + boxes[id].height;
            }
        }else{
            h = boxes[id].position.y + boxes[id].height;
        }
        if(h > newHeight){
            newHeight = h;
        }
    });
    return newHeight;
}

function boxesById(state = {}, action = {}){
    switch (action.type){
        case ADD_BOX:
            let box = boxCreator(state[action.payload.ids.id], action);
            if(action.payload.ids.parent.indexOf(ID_PREFIX_PAGE) !== -1 || action.payload.ids.parent.indexOf(ID_PREFIX_SECTION) !== -1){
                return Object.assign({}, state, {
                    [action.payload.ids.id]: box
                });
            }
            return Object.assign({}, state, {
                [action.payload.ids.id]: box,
                [action.payload.ids.parent]: Object.assign({}, state[action.payload.ids.parent], {
                    children: (state[action.payload.ids.parent].children.indexOf(action.payload.ids.container) !== -1) ?
                        state[action.payload.ids.parent].children :
                        [...state[action.payload.ids.parent].children, action.payload.ids.container],
                    sortableContainers: sortableContainerCreator(state[action.payload.ids.parent].sortableContainers, action, [box])
                })
            });
           // return state;
        case MOVE_BOX:
            if(state[action.payload.id].container){
                let parent = state[action.payload.id].parent;
                return Object.assign({}, state, {
                    [action.payload.id]: Object.assign({}, state[action.payload.id], {position: {x: action.payload.x, y: action.payload.y}}),
                    [parent]: Object.assign({}, state[parent], {
                        sortableContainers: sortableContainerCreator(state[parent].sortableContainers, action, state)
                    })
                })
            }
            return Object.assign({}, state, {
                [action.payload.id]: Object.assign({}, state[action.payload.id], {position: {x: action.payload.x, y: action.payload.y}})
            });
        case RESIZE_BOX:
            if(state[action.payload.id].container){
                let parent = state[action.payload.id].parent;
                return Object.assign({}, state, {
                    [action.payload.id]: Object.assign({}, state[action.payload.id], {width: action.payload.width, height: action.payload.height}),
                    [parent]: Object.assign({}, state[parent], {
                        sortableContainers: sortableContainerCreator(state[parent].sortableContainers, action, state)
                    })
                })
            }
            return Object.assign({}, state, {
                [action.payload.id]: Object.assign({}, state[action.payload.id], {width: action.payload.width, height: action.payload.height})
            });
        case UPDATE_BOX:
            return Object.assign({}, state, {
                [action.payload.id]: Object.assign({}, state[action.payload.id], {content: action.payload.content})
            });
        case UPDATE_TOOLBAR:
            if(action.payload.name === 'width'){
                return Object.assign({}, state, {
                    [action.payload.caller]: Object.assign({}, state[action.payload.caller], {width: (action.payload.value + '%')})
                });
            }
            return state;
        case DELETE_BOX:
            var newState = Object.assign({}, state);
            delete newState[action.payload.id];

            if(state[action.payload.id].container){
                let parent = state[action.payload.id].parent;
                let container = state[action.payload.id].container;
                newState[parent].sortableContainers = sortableContainerCreator(newState[parent].sortableContainers, action, state);
                if(!newState[parent].sortableContainers[container]){
                    newState[parent].children = newState[parent].children.filter(id => id !== container);
                }
            }
            return newState;
        case REMOVE_NAV_ITEM:
            var newState = Object.assign({}, state)
            action.payload.boxes.map(box => { delete newState[box]})
            return newState;

        case REORDER_BOX:
            let oldChildren = state[action.payload.parent].children
            var newChildren = Object.keys(oldChildren).map(i => oldChildren[action.payload.ids[i]])
            return Object.assign({}, state, {
                [action.payload.parent]: Object.assign({}, state[action.payload.parent], {children: newChildren}) });
        case IMPORT_STATE:
            return action.payload.present.boxesById;
        default:
            return state;
    }
}

function boxSelected(state = -1, action = {}) {
    switch (action.type) {
        case ADD_BOX:
            return action.payload.ids.id;
        case SELECT_BOX:
            return action.payload.id;
        case DELETE_BOX:
            return -1;
        case SELECT_NAV_ITEM:
            return -1;
        case IMPORT_STATE:
            return action.payload.present.boxSelected;
        case REMOVE_NAV_ITEM:
            return -1;
        default:
            return state;
    }
}

function boxesIds(state = [], action = {}){
    switch (action.type){
        case ADD_BOX:
            return [...state, action.payload.ids.id];
        case DELETE_BOX:
            return  state.filter(id => id!=action.payload.id);
        case REMOVE_NAV_ITEM:
            return  state.filter(i=> { 
                if (action.payload.boxes.indexOf(i)==-1){ return i;}
            });

        case IMPORT_STATE:
            return action.payload.present.boxes;    
        default:
            return state;
    }
}

function navItemCreator(state = {}, action = {}){
    switch (action.type){
        case ADD_NAV_ITEM:
            return {id: action.payload.id,
                name: action.payload.name,
                isExpanded: true,
                parent: action.payload.parent,
                children: action.payload.children,
                boxes: [],
                level: action.payload.level,
                type: action.payload.type,
                position: action.payload.position,
                titlesReduced: action.payload.titlesReduced

            };
        default:
            return state;
    }
}

function recalculateNames(state = {},old = {}, resta = 0, numeroBorrados = 0){
    var items = state
    var sectionNum = 1;
    //Recalculate positions
    for (let i in items){
        if(resta == 1) {
            if(items[i].position >= old.position){
                items[i].position -= numeroBorrados;
            }
        } else {
            if (items[i].position > old.position || (items[i].position == old.position && items[i].level<old.level) ){        
                items[i].position++;
            }
        }
    }
    // Rename pages
    var pages = Object.keys(state).filter(page => {
        if(state[page].type == 'slide'|| state[page].type == 'document'){
            return page;
        }
    }).sort(function(a, b){return state[a].position-state[b].position;});

    pages.forEach((page,index) => {
        items[page].name = 'Page ' + (index+1) ;
     });

    // Rename sections
    var mainindex = 1;
    var secondindex = 1;

    var sections = Object.keys(state).filter(sec => {
        if(state[sec].type == 'section'){
            return sec;
        }
    }).sort(function(a, b){return state[a].position-state[b].position});

    sections.forEach((section,index) => {
        if(items[section].level == 1){
             items[section].name = 'Section '+(mainindex++);
        } else {
            var sub = items[items[section].parent].children.filter(s => s[0]=='s').indexOf(section)+1
            items[section].name = items[items[section].parent].name+'.'+ sub;
        }
     });

    return items;
}

function navItemsIds(state = [], action = {}){
    switch(action.type){
        case ADD_NAV_ITEM:
            let nState = state.slice();
            nState.splice(action.payload.position, 0, action.payload.id);
            return nState;
        case REMOVE_NAV_ITEM:
            let newState = state.slice();
            action.payload.ids.forEach(id =>{
                newState.splice(newState.indexOf(id), 1);
            });
            return newState;

        //case REORDER_NAV_ITEM:
        //let newNavOrder = state.slice()
        /*
            let neState = state.slice()
            console.log('neState')
            console.log(neState)
            console.log('action')
            console.log(action.payload.ids)
            var newNavOrder = Object.keys(neState).map(i => neState[action.payload.ids[i]] );
            console.log('newNavOrder')
            console.log(newNavOrder)*/
            //return newNavOrder;
            //return newState;
        case IMPORT_STATE:
            return action.payload.present.navItemsIds;
        default:
            return state;
    }
}

function navItemsById(state = {}, action = {}){
    switch(action.type){
        case SELECT_NAV_ITEM:
            return state;
        case ADD_NAV_ITEM:
            var newState = Object.assign({}, state, {
                [action.payload.id]: navItemCreator(state[action.payload.id], action),
                [action.payload.parent]: Object.assign({}, state[action.payload.parent], {children: [...state[action.payload.parent].children, action.payload.id]})
            });
            return recalculateNames(newState, newState[action.payload.id],0)
        case EXPAND_NAV_ITEM:
            return Object.assign({}, state, {[action.payload.id]: Object.assign({}, state[action.payload.id], {isExpanded: action.payload.value})});
        case TOGGLE_TITLE_MODE:
            return Object.assign({}, state, {[action.payload.id]: Object.assign({}, state[action.payload.id], {titlesReduced: action.payload.value})});
        case REMOVE_NAV_ITEM:
            let oldOne = Object.assign({},state[action.payload.ids[0]])
            let newState = Object.assign({}, state);
            action.payload.ids.map(id =>{
                delete newState[id];
            });
            let newChildren = newState[action.payload.parent].children.slice();
            newChildren.splice(newChildren.indexOf(action.payload.ids[0]), 1);
            let wrongNames = Object.assign({}, newState, {[action.payload.parent]: Object.assign({}, newState[action.payload.parent], {children: newChildren})});
            return recalculateNames(wrongNames, oldOne,1, action.payload.ids.length)
        //Tocar aqui
        case REORDER_NAV_ITEM:
            //console.log(action.payload.ids);
            let oldChilds = state[0].children;
            //console.log(oldChilds)
            var newNavOrder = Object.keys(oldChilds).map(i => oldChilds[action.payload.ids[i]]);
            //console.log(newNavOrder);
        var newSt = Object.assign({}, state, {
               [action.payload.parent]: Object.assign({}, state[action.payload.parent], {children: newNavOrder})
            });
            return newSt
        case ADD_BOX:
            if(action.payload.ids.parent.indexOf(ID_PREFIX_PAGE) !== -1 || action.payload.ids.parent.indexOf(ID_PREFIX_SECTION) !== -1)
                return Object.assign({}, state, {
                    [action.payload.ids.parent]: Object.assign({}, state[action.payload.ids.parent], {
                        boxes: [...state[action.payload.ids.parent].boxes, action.payload.ids.id]})});
            return state
        case DELETE_BOX:
            if (action.payload.parent.indexOf(ID_PREFIX_PAGE) !== -1 || action.payload.parent.indexOf(ID_PREFIX_SECTION) !== -1){ 
                let currentBoxes = state[action.payload.parent].boxes;    
                var newBoxes =  currentBoxes.filter(id => id!=action.payload.id);
                if(action.payload.parent !== 0 ){
                    return Object.assign({}, state, {
                        [action.payload.parent]: Object.assign({}, state[action.payload.parent], {
                            boxes: newBoxes})});
                }
            }
            return state;
              
        case IMPORT_STATE:
            return action.payload.present.navItemsById;
        default:
            return state;
    }
}

function navItemSelected(state = 0, action = {}){
    switch(action.type){
        case SELECT_NAV_ITEM:

            return action.payload.id;
        case ADD_NAV_ITEM:
            return action.payload.id;
        case REMOVE_NAV_ITEM:
            return 0;
        case IMPORT_STATE:
            return action.payload.present.navItemSelected;
        default:
            return state;
    }
}

function toolbarsById(state = {}, action = {}){
    switch(action.type) {
        case ADD_BOX:
            let toolbar = {
                id: action.payload.ids.id,
                buttons: action.payload.toolbar,
                config: action.payload.config,
                state: action.payload.state,
                showTextEditor: false
            };
            if(action.payload.ids.container !== 0){
                if(!toolbar.buttons){
                    toolbar.buttons = [];
                    toolbar.config = {};
                }
                toolbar.buttons.push({
                    name: 'width',
                    humanName: 'Width (%)',
                    type: 'number',
                    value: 100,
                    min: 0,
                    max: 100,
                    step: 5,
                    autoManaged: true
                });
            }
            if(action.payload.ids.id.indexOf(ID_PREFIX_SORTABLE_BOX) === -1) {
                if(!toolbar.buttons) {
                    toolbar.buttons = [];
                    toolbar.config = {};
                }
                toolbar.buttons.push({
                    name: 'alias',
                    humanName: 'Alias',
                    type: 'text',
                    value: '',
                    autoManaged: true,
                    isAttribute: true
                });
            }
            return Object.assign({}, state, {[action.payload.ids.id]: toolbar});
        case DELETE_BOX:
            var newState = Object.assign({},state);
            delete newState[action.payload.id];
            /*
                let newState = Object.assign({}, state);
                if(action.payload.parent.indexOf(ID_PREFIX_SORTABLE_CONTAINER) !== -1){
                    if(newState[action.payload.parent].length === 1) {
                        delete newState[action.payload.parent];
                    }else {
                        newState[action.payload.parent] = newState[action.payload.parent].filter(id => id !== action.payload.id);
                    }
                }
                return newState;
                */
                /*
                var parent = state[action.payload.parent];
                console.log(parent);
                 if (parent) {
                    parent.children = parent.children.filter(id =>  id!=action.payload.id);
                    newState = Object.assign({},newState, parent);
                }
            */
            return newState;
        case UPDATE_TOOLBAR:
            let newState = state[action.payload.caller].buttons.slice();
            newState[action.payload.index] = Object.assign({}, newState[action.payload.index], {value: action.payload.value});
            return Object.assign({}, state, {
                [action.payload.caller]: Object.assign({}, state[action.payload.caller], {buttons: newState})
            });
        case UPDATE_BOX:
            return Object.assign({}, state, {
                [action.payload.id]: Object.assign({}, state[action.payload.id], {state: action.payload.state})
            });
        case TOGGLE_TEXT_EDITOR:
            return Object.assign({}, state, {
                [action.payload.caller]: Object.assign({}, state[action.payload.caller], {showTextEditor: action.payload.value})
            });
        case IMPORT_STATE:
            return action.payload.present.toolbarsById;

        case REMOVE_NAV_ITEM:
            var newState = Object.assign({},state)
            action.payload.boxes.map(box => { delete newState[box]})
            return newState;
        default:
            return state;
    }
}

function togglePluginModal(state = {caller: 0, container: 0, fromSortable: false}, action = {}){
    switch(action.type){
        case TOGGLE_PLUGIN_MODAL:
            return action.payload;
        case ADD_BOX:
            return {caller: 0, container: 0, fromSortable: false};
        case IMPORT_STATE:
            return action.payload.present.boxModalToggled;
        default:
            return state;
    }
}

function togglePageModal(state = {value: false, caller: 0}, action = {}){
    switch(action.type){
        case TOGGLE_PAGE_MODAL:
            return action.payload;
        case ADD_NAV_ITEM:
            return {value: false, caller: 0};
        case IMPORT_STATE:
            return action.payload.present.pageModalToggled;
        default:
            return state;
    }
}

function changeDisplayMode(state = "", action = {}){
    switch(action.type){
        case CHANGE_DISPLAY_MODE:
            return action.payload.mode;
        case IMPORT_STATE:
            return action.payload.present.displayMode;
        default:
            return state;
    }
}

function isBusy(state = "", action = {}){
    switch(action.type){
        case SET_BUSY:
            return action.payload.msg;
        case IMPORT_STATE:
            return action.payload.present.isBusy;
        default:
            return state;
    }
}

const GlobalState = undoable(combineReducers({
    boxModalToggled: togglePluginModal,
    pageModalToggled: togglePageModal,
    boxesById: boxesById, //{0: box0, 1: box1}
    boxSelected: boxSelected, //0
    boxes: boxesIds, //[0, 1]
    navItemsIds: navItemsIds, //[0, 1]
    navItemSelected: navItemSelected, // 0
    navItemsById: navItemsById, // {0: navItem0, 1: navItem1}
    displayMode: changeDisplayMode, //"list",
    toolbarsById: toolbarsById, // {0: toolbar0, 1: toolbar1}
    isBusy: isBusy
}), { filter: (action, currentState, previousState) => {
    if(action.type === EXPAND_NAV_ITEM)
        return false;
    else if(action.type === TOGGLE_PAGE_MODAL)
        return false;
    else if(action.type === TOGGLE_PLUGIN_MODAL)
        return false;
    else if(action.type === TOGGLE_TITLE_MODE)
        return false;
    else if(action.type === CHANGE_DISPLAY_MODE)
        return false;
    else if(action.type === SET_BUSY)
        return false;
    return currentState !== previousState; // only add to history if state changed
    }});

export default GlobalState;