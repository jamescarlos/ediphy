import React from 'react';
import PluginPlaceholder from '../../_editor/components/canvas/plugin_placeholder/PluginPlaceholder';
import './_truefalse.scss';
import i18n from 'i18next';
import { letterFromNumber } from '../../common/common_tools';
/* eslint-disable react/prop-types */

export function TrueFalse(base) {
    return {
        getConfig: function() {
            return {
                name: 'TrueFalse',
                displayName: Ediphy.i18n.t('TrueFalse.PluginName'),
                category: 'evaluation',
                icon: 'check_circle',
                initialWidth: '60%',
                flavor: 'react',
                isComplex: true,
                defaultCorrectAnswer: ["false", "false", "false"],
                defaultCurrentAnswer: ["", "", ""],
            };
        },
        getToolbar: function(state) {
            return {
                main: {
                    __name: "Main",
                    accordions: {
                        __score: {
                            __name: i18n.t('configuration'),
                            icon: 'build',
                            buttons: {
                                nBoxes: {
                                    __name: i18n.t("TrueFalse.Number"),
                                    type: 'number',
                                    value: state.nBoxes,
                                    min: 1,
                                    autoManaged: false,
                                },
                                showFeedback: {
                                    __name: i18n.t("MultipleChoice.ShowFeedback"),
                                    type: 'checkbox',
                                    checked: state.showFeedback,
                                },
                                allowPartialScore: {
                                    __name: i18n.t("MultipleAnswer.AllowPartialScore"),
                                    type: 'checkbox',
                                    checked: state.allowPartialScore,
                                },
                            },
                        },
                        style: {
                            __name: Ediphy.i18n.t('HotspotImages.box_style'),
                            icon: 'palette',
                            buttons: {
                                padding: {
                                    __name: Ediphy.i18n.t('HotspotImages.padding'),
                                    type: 'number',
                                    value: 10,
                                    min: 0,
                                    max: 100,
                                },
                                backgroundColor: {
                                    __name: Ediphy.i18n.t('HotspotImages.background_color'),
                                    type: 'color',
                                    value: '#ffffff',
                                },
                                borderWidth: {
                                    __name: Ediphy.i18n.t('HotspotImages.border_size'),
                                    type: 'number',
                                    value: 1,
                                    min: 0,
                                    max: 10,
                                },
                                borderStyle: {
                                    __name: Ediphy.i18n.t('HotspotImages.border_style'),
                                    type: 'select',
                                    value: 'solid',
                                    options: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'initial', 'inherit'],
                                },
                                borderColor: {
                                    __name: Ediphy.i18n.t('HotspotImages.border_color'),
                                    type: 'color',
                                    value: '#dbdbdb',
                                },
                                borderRadius: {
                                    __name: Ediphy.i18n.t('HotspotImages.radius'),
                                    type: 'number',
                                    value: 0,
                                    min: 0,
                                    max: 50,
                                },
                                opacity: {
                                    __name: Ediphy.i18n.t('HotspotImages.opacity'),
                                    type: 'range',
                                    value: 1,
                                    min: 0,
                                    max: 1,
                                    step: 0.01,
                                },
                            },
                        },
                    },
                },
            };
        },
        getInitialState: function() {
            return {
                nBoxes: 3,
                showFeedback: true,
                allowPartialScore: true,
            };
        },
        getRenderTemplate: function(state, props = {}) {
            let answers = [];
            for (let i = 0; i < state.nBoxes; i++) {
                let clickHandler = (index, value)=>{
                    if(props.exercises && props.exercises.correctAnswer && (props.exercises.correctAnswer instanceof Array)) {
                        let nBoxes = Array(state.nBoxes).fill("");
                        let newAnswer = nBoxes.map((ans, ind)=>{
                            if (index === ind) {
                                return value;
                            }
                            return props.exercises.correctAnswer[ind];
                        });
                        props.setCorrectAnswer(newAnswer);
                    }

                };
                answers.push(<div key={i + 1} className={"row answerRow"}>
                    <div className={"col-xs-1 answerPlaceholder"}>
                        <input type="radio" className="radioQuiz" name={props.id + "_" + i} value={"true"} checked={props.exercises && props.exercises.correctAnswer[i] === "true" /* ? 'checked' : 'unchecked'*/ }
                            onChange={()=>{clickHandler(i, "true");}} /></div>
                    <div className={"col-xs-1 answerPlaceholder"}>
                        <input type="radio" className="radioQuiz" name={props.id + "_" + i} value={"false"} checked={props.exercises && props.exercises.correctAnswer[i] === "false" /* ? 'checked' : 'unchecked'*/ }
                            onChange={()=>{clickHandler(i, "false");}} />
                    </div>
                    <div className={"col-xs-10"}>
                        <PluginPlaceholder {...props} key={i + 1} plugin-data-display-name={i18n.t("TrueFalse.Answer") + " " + (i + 1)} plugin-data-default="BasicText" plugin-data-text={'<p>' + i18n.t("TrueFalse.Answer") + " " + (1 + i) + '</p>'} pluginContainer={"Answer" + i} />
                    </div>
                </div>
                );
            }
            return <div className={"exercisePlugin truefalsePlugin"}>
                <div className={"row"} key={-1}>
                    <div className={"col-xs-12"}>
                        <PluginPlaceholder {...props} key="1" plugin-data-display-name={i18n.t("TrueFalse.Question")} plugin-data-default="BasicText" plugin-data-text={'<p>' + i18n.t("TrueFalse.Statement") + '</p>'} pluginContainer={"Question"} />
                    </div>
                </div>
                <div className={"row TFRow"} key={0}>
                    <div className={"col-xs-1"}>
                        <i className="material-icons true">done</i>
                    </div>
                    <div className={"col-xs-1"}>
                        <i className="material-icons false">clear</i>
                    </div>
                    <div className={"col-xs-10"} /></div>
                {answers}
                <div className={"row feedbackRow"} key={-2} style={{ display: state.showFeedback ? 'block' : 'none' }}>
                    <div className={"col-xs-12 feedback"}>
                        <PluginPlaceholder {...props} key="-2" plugin-data-display-name={i18n.t("TrueFalse.Feedback")} plugin-data-default="BasicText" plugin-data-text={'<p>' + i18n.t("TrueFalse.FeedbackMsg") + '</p>'} pluginContainer={"Feedback"} />
                    </div>
                </div>
            </div>;

        },
    };
}
/* eslint-enable react/prop-types */

