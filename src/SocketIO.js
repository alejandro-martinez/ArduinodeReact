/*jshint esversion: 6 */
import React, { Component } from 'react';
import io from 'socket.io-client'
let socket = io( 'http://192.168.20.1:8888' )
/*
class SocketIO extends Component {
  constructor () {
    super()

    socket.on(`server:event`, data => {
      this.setState({ data })
    })
  }

  sendMessage = message => {
    socket.emit(`client:sendMessage`, message)
  }

  render () {
    return ()
  }
}*/