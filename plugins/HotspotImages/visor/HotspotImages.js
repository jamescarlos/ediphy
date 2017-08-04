import React from "react";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export function HotspotImages(base) {
    return {
        getRenderTemplate: function(state, id) {
            let marks = state.__marks;
            let box_id = id;

            /* jshint ignore:start */
            let markElements = Object.keys(marks).map((e) =>{

                let position = marks[e].value.split(',');
                let title = marks[e].title;

                return(
                    <a key={e} style={{ position: 'absolute', top: position[0] + "%", left: position[1] + "%", width: '24px', height: '26px' }} onClick={()=>{this.onMarkClicked(box_id, marks[e].value);}} href="#">
                        <OverlayTrigger placement="top" overlay={<Tooltip positionLeft="-12" id={e}>{title}</Tooltip>}>
                            <i key="i" style={{ width: "100%", height: "100%", position: 'absolute', top: '-26px', left: '-12px' }} className="material-icons">room</i>
                        </OverlayTrigger>
                    </a>
                );
            });

            return(
                <div>
                    <img style={{ height: "100%", width: "100%" }} src={state.url}/>
                    {markElements}
                </div>);
            /* jshint ignore:end */
        },
        onMarkClicked(element, value) {
            base.triggerMark(element, value, false);
        },
    };
}
