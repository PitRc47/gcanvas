import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PixelRatio,
  StatusBar,
} from 'react-native';
import { GCanvasView } from '@flyskywhy/react-native-gcanvas';

export default class FullScreenGCanvasApp extends Component {
  ws = null;

  constructor(props) {
    super(props);
    this.canvas = null;
    this.ctx = null;
    this.state = {
      canvasLogicalWidth: 0,
      canvasLogicalHeight: 0,
      isCanvasReady: false,
    };
    console.log("FullScreenGCanvasApp constructor called");
    
  }

  componentDidMount() {
    console.log('ComponentDidMount: 正在创建 WebSocket 连接...');

    this.ws = new WebSocket('ws://127.0.0.1:4747');

    this.ws.onopen = () => {
      console.log('WebSocket 连接已打开');
      // 如果需要在 UI 上反映连接状态，使用 this.setState
      // this.setState({ isConnected: true, error: null });
      // 连接成功后，你可以在这里发送初始化消息等
      // this.ws.send('Hello!');
    };

    this.ws.onmessage = (event) => {
      console.log('收到消息:', event.data);
      // 处理收到的消息，例如更新 state 来在 UI 上显示
      // this.setState(prevState => ({
      //   receivedMessages: [...prevState.receivedMessages, event.data]
      // }));
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket 错误:', event);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket 连接已关闭:', event.code, event.reason);
    };
  }

  // 在组件即将卸载时执行，适合进行清理工作，例如关闭连接
  componentWillUnmount() {
    console.log('ComponentWillUnmount: 正在清理 WebSocket 连接...');
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
      console.log('WebSocket 连接已关闭.');
    }
    // 释放实例引用 (可选，但推荐)
    this.ws = null;
  }

  initCanvas = (canvas) => {
    if (this.canvas) {
      console.log("Canvas instance already received via onCanvasCreate.");
      return;
    }
    console.log("onCanvasCreate: Canvas instance received.");
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.setState({ isCanvasReady: true }, () => {
      if (this.state.canvasLogicalWidth > 0 && this.state.canvasLogicalHeight > 0) {
        console.log("onCanvasCreate callback: Canvas ready and layout dimensions available. Setting canvas buffer size.");
        this.setCanvasSize(this.state.canvasLogicalWidth, this.state.canvasLogicalHeight);
      } else {
        console.log("onCanvasCreate callback: Canvas ready, waiting for onLayout to provide dimensions.");
      }
    });
  };

  handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    console.log(`onLayout: Detected layout dimensions (logical): ${width}x${height}`);

    if (width > 0 && height > 0 && (width !== this.state.canvasLogicalWidth || height !== this.state.canvasLogicalHeight)) {
      console.log("onLayout: Layout dimensions changed or initialized. Updating state.");
    
      this.setState({ canvasLogicalWidth: width, canvasLogicalHeight: height }, () => {
        if (this.canvas && this.state.isCanvasReady) {
          console.log("onLayout callback: Layout updated and canvas ready. Setting canvas buffer size.");
          this.setCanvasSize(width, height);
        } else {
           console.log("onLayout callback: Layout updated, but canvas instance not yet ready. Size will be set once canvas is ready.");
        }
      });
    } else if (width <= 0 || height <= 0) {
        console.warn(`onLayout: Received invalid dimensions: ${width}x${height}. Ignoring.`);
    } else {
        console.log("onLayout: Dimensions are the same as current state. No update needed.");
    }
  };

  setCanvasSize = (logicalWidth, logicalHeight) => {
      if (!this.canvas) {
          console.error("setCanvasSize Error: Cannot set size because canvas instance is null.");
          return;
      }
      const scale = PixelRatio.get();
      const physicalWidth = Math.round(logicalWidth * scale);
      const physicalHeight = Math.round(logicalHeight * scale);

      if (physicalWidth <= 0 || physicalHeight <= 0) {
          console.error(`setCanvasSize Error: Calculated invalid physical dimensions ${physicalWidth}x${physicalHeight} from logical ${logicalWidth}x${logicalHeight} and scale ${scale}. Aborting size set.`);
          return;
      }

      if (this.canvas.width !== physicalWidth || this.canvas.height !== physicalHeight) {
            this.canvas.width = physicalWidth;
            this.canvas.height = physicalHeight;
            console.log(`setCanvasSize: Canvas buffer size set to physical: ${this.canvas.width}x${this.canvas.height} (based on logical: ${logicalWidth}x${logicalHeight}, scale: ${scale})`);
      } else {
          console.log(`setCanvasSize: Canvas buffer size ${this.canvas.width}x${this.canvas.height} is already up-to-date.`);
      }
  }

  drawSimpleShapes = () => {
    if (!this.ctx) {
        console.error("drawSimpleShapes Error: Canvas context (ctx) is not available.");
        return;
    }
    if (!this.canvas) {
        console.error("drawSimpleShapes Error: Canvas instance is not available.");
        return;
    }
    if (!(this.canvas.width > 0 && this.canvas.height > 0)) {
        console.error(`drawSimpleShapes Error: Canvas physical dimensions (${this.canvas.width}x${this.canvas.height}) are invalid or not yet set. Cannot draw.`);
        alert("Canvas 尺寸尚未就绪，请稍后再试。");
        return;
    }

    console.log(`Drawing simple shapes on canvas with physical size: ${this.canvas.width}x${this.canvas.height}`);
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const scale = PixelRatio.get();

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, width, height);
    console.log(`Drew lightblue background covering ${width}x${height}`);

    ctx.fillStyle = 'red';
    const rectX = width * 0.1;
    const rectY = height * 0.1;
    const rectWidth = width * 0.3;
    const rectHeight = height * 0.2;
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    console.log(`Drew red rect at (${rectX.toFixed(2)}, ${rectY.toFixed(2)}) size ${rectWidth.toFixed(2)}x${rectHeight.toFixed(2)}`);

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    const circleX = width * 0.7;
    const circleY = height * 0.6;
    const radius = width * 0.15;
    ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
    ctx.stroke();
    console.log(`Drew blue circle at (${circleX.toFixed(2)}, ${circleY.toFixed(2)}) with radius ${radius.toFixed(2)}, lineWidth ${ctx.lineWidth}`);

    console.log("Drawing complete.");

  };

  render() {
    console.log("Rendering FullScreenGCanvasApp...");
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <GCanvasView
          style={styles.gcanvas}
          onCanvasCreate={this.initCanvas}
          onLayout={this.handleLayout}
        />
        <TouchableOpacity onPress={this.drawSimpleShapes} style={styles.drawButton}>
          <Text style={styles.buttonText}>点我绘制</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333', // 给容器加个深色背景，方便看到 Canvas 区域
  },
  gcanvas: {
    flex: 1,
  },
  drawButton: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    width: 180,
    marginLeft: -90,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});