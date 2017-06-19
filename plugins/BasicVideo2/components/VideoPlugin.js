import React from 'react';
import { findDOMNode } from 'react-dom';
import ReactPlayer from 'react-player';
import screenfull from 'screenfull';

export default class VideoPlugin extends React.Component {
   constructor(props){
    super(props);
    this.state = {
        volume: 0.8,
        duration: 0,
        playing: true,
        played: 0,
        seeking: false
    };
   }


   playPause(){
       this.setState({playing: !this.state.playing});
   }

   onClickFullscreen(){
        screenfull.request(findDOMNode(this.player));
   }

   setVolume(e){
       this.setState({volume: parseFloat(e.target.value)});
   }

   setPlaybackRate(e){
        console.log(parseFloat(e.target.value));
        this.setState({ playbackRate: parseFloat(e.target.value) });
    }

    onSeekMouseDown(){
        this.setState({ seeking: true });
    }

    onSeekChange(e){
        this.setState({ played: parseFloat(e.target.value) });
    }

    onSeekMouseUp(e){
        this.setState({ seeking: false });
        this.player.seekTo(parseFloat(e.target.value));
    }

    onProgress(state){
        // We only want to update time slider if we are not currently seeking
        if (!this.state.seeking) {
            this.setState(state);
        }
    }
    render(){
        /* jshint ignore:start */
        return (
            <div width='100%'
                 height='100%' className="player-wrapper">
                <ReactPlayer
                    ref={player => { this.player = player }}
                    width='100%'
                    height='100%'
                    url={this.props.state.url}
                    playing={this.state.playing}
                    volume={this.state.volume}
                    onPlay={() => this.setState({ playing: true })}
                    onPause={() => this.setState({ playing: false })}
                    onEnded={() => this.setState({ playing: false })}
                    onProgress={this.onProgress.bind(this)}
                    onDuration={duration => this.setState({ duration })}
                />
                <table><tbody>
                <tr>
                    <th>Controls</th>
                    <td>
                        <button onClick={this.playPause.bind(this)}>{this.state.playing ? 'Pause' : 'Play'}</button>
                        <button onClick={this.onClickFullscreen.bind(this)}>Fullscreen</button>
                        <button onClick={this.setPlaybackRate.bind(this)} value={1}>1</button>
                        <button onClick={this.setPlaybackRate.bind(this)} value={1.5}>1.5</button>
                        <button onClick={this.setPlaybackRate.bind(this)} value={2}>2</button>
                    </td>
                </tr>
                <tr>
                    <th>Seek</th>
                    <td>
                        <input
                            type='range' min={0} max={1} step='any'
                            value={this.state.played}
                            onMouseDown={this.onSeekMouseDown.bind(this)}
                            onChange={this.onSeekChange.bind(this)}
                             onMouseUp={this.onSeekMouseUp.bind(this)}
                        />
                    </td>
                </tr>
                <tr>
                    <th>Volume</th>
                    <td>
                        <input type='range' min={0} max={1} step='any' value={this.state.volume} onChange={this.setVolume.bind(this)} />
                    </td>
                </tr>
                <tr>
                    <th>Played</th>
                    <td><progress max={1} value={this.state.played} /></td>
                </tr>
                </tbody></table>
            </div>
        );
        /* jshint ignore:end */
    }
}