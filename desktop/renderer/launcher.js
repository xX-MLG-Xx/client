// @flow
import Menubar from '../shared/menubar'
import React, {Component} from 'react'
import RemoteStore from './remote-store.desktop'
import Root from './container'
import hello from '../shared/util/hello'
import loadPerf from '../shared/util/load-perf'
import reactDOM from 'react-dom'
import {disable as disableDragDrop} from '../shared/util/drag-drop'
import {makeEngine} from '../shared/engine'
import {remote} from 'electron'
import {setupContextMenu} from '../app/menu-helper'
// $FlowIssue
import {setupSource} from '../shared/util/forward-logs'

setupSource()
disableDragDrop()
makeEngine()
hello(process.pid, 'Menubar', process.argv, __VERSION__) // eslint-disable-line no-undef

if (module.hot) {
  module.hot.accept()
}

let _store

class RemoteMenubar extends Component {
  constructor () {
    super()
    loadPerf()
  }
  render () {
    return (
      <Root store={_store}>
        <Menubar />
      </Root>
    )
  }
}

setupContextMenu(remote.getCurrentWindow())

function load () {
  if (!_store) {
    _store = new RemoteStore({component: 'menubar'})
  }
  reactDOM.render(<RemoteMenubar />, document.getElementById('root'))
}

window.load = load
