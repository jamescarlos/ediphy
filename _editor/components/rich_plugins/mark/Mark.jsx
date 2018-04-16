import React, { Component } from 'react';
import { OverlayTrigger, Tooltip, Popover } from 'react-bootstrap';
import PropTypes from 'prop-types';
import i18n from 'i18next';
export default class Mark extends Component {
    render() {
        let PopoverMark = (<Popover id="popover-trigger-click-root-close">{this.props.markConnection}</Popover>);
        let ToolTipDefault = (<Tooltip positionLeft="-12" id={this.props.idKey}>{this.props.title}</Tooltip>);
        return (
            <OverlayTrigger key={this.props.idKey}
                text={this.props.title}
                placement="top"
                overlay={this.props.isPopUp ? PopoverMark : ToolTipDefault }
                trigger={ this.props.isPopUp ? "click" : ['hover', 'focus']} rootClose>
                <a className="mapMarker" href="#" onClick={this.props.isVisor ? ()=>{this.props.onMarkClicked(this.props.boxID, this.props.markValue);} : null}>
                    <i key="i" style={{ color: this.props.color }} className="material-icons">room</i>
                </a>
            </OverlayTrigger>
        );
    }
}

Mark.propTypes = {
    /**
     * Box mark id
     */
    boxID: PropTypes.any,
    /**
     * Mark color
     */
    color: PropTypes.any,
    /**
     * Id of the mark
     */
    idKey: PropTypes.any,
    /**
     * Check if mark type is a PopUp
     */
    isPopUp: PropTypes.bool,
    /**
     * Check if editor or visor mark
     */
    isVisor: PropTypes.bool,
    /**
     * Popover mark text
     */
    markConnection: PropTypes.string,
    /**
     * Mark Value to determine what click-mark do
     */
    markValue: PropTypes.any,
    /**
     * Mark title
     */
    title: PropTypes.string,
    /**
     * Callback to dispach mark action
     */
    onMarkClicked: PropTypes.func,
};
