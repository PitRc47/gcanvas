import React, { Component } from 'react';
import {
  AppRegistry, // 确保 AppRegistry 在 index.js 中使用
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PixelRatio, // 用于获取设备像素密度
} from 'react-native';
// 只导入 GCanvasView
import { GCanvasView } from '@flyskywhy/react-native-gcanvas';

// 这个组件命名为你喜欢或原来的名字，比如 App
export default class SimpleGCanvasApp extends Component {
  constructor(props) {
    super(props);
    this.canvas = null;
    this.ctx = null;
    console.log("SimpleGCanvasApp constructor called");
  }

  // 初始化 Canvas 的回调函数
  initCanvas = (canvas) => {
    if (this.canvas) {
      console.log("Canvas already initialized.");
      return;
    }
    console.log("Initializing canvas...");
    this.canvas = canvas;
    // 获取 2d 上下文
    this.ctx = this.canvas.getContext('2d');

    // 重要：设置 Canvas 的实际宽高（以物理像素为单位）
    // GCanvasView 的 style 决定了布局大小 (CSS pixels)
    // 我们需要根据布局大小和像素密度来设置 canvas 的绘图缓冲大小
    const { width, height } = StyleSheet.flatten(styles.gcanvas); // 获取 style 中的逻辑宽高
    if (typeof width === 'number' && typeof height === 'number') {
        const scale = PixelRatio.get();
        this.canvas.width = width * scale;
        this.canvas.height = height * scale;
        console.log(`Canvas initialized with physical size: ${this.canvas.width}x${this.canvas.height} (scale: ${scale})`);
        // 可以在这里立即绘制一次初始内容
        // this.drawSimpleShapes(); 
    } else {
        console.warn("Canvas style width/height not defined numerically, cannot set canvas buffer size reliably.");
        // 如果没有在 style 中设置固定宽高，GCanvasView 会尝试自动处理，
        // 但显式设置通常更可靠。此时获取 canvas.width 可能不准确。
    }
  };

  // 绘制简单图形的函数
  drawSimpleShapes = () => {
    if (this.ctx && this.canvas) {
      console.log("Drawing simple shapes...");
      const ctx = this.ctx;
      // 注意：这里的 canvas.width/height 是我们上面设置的物理像素值
      const width = this.canvas.width; 
      const height = this.canvas.height;

      if (!width || !height) {
          console.error("Canvas width or height is invalid:", width, height);
          return;
      }

      // 1. 清空画布
      ctx.clearRect(0, 0, width, height);

      // 2. 绘制一个红色填充矩形
      ctx.fillStyle = 'red';
      // 坐标和尺寸也使用相对于物理像素的值
      // 为了简单起见，我们直接用一些数值，或者基于 width/height 计算
      const rectX = width * 0.1;
      const rectY = height * 0.1;
      const rectWidth = width * 0.3;
      const rectHeight = height * 0.2;
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
      console.log(`Drew red rect at (${rectX}, ${rectY}) size ${rectWidth}x${rectHeight}`);

      // 3. 绘制一个蓝色描边圆形
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 5 * PixelRatio.get(); // 线宽也考虑像素密度
      ctx.beginPath(); // 开始新的路径
      const circleX = width * 0.6;
      const circleY = height * 0.4;
      const radius = width * 0.15;
      ctx.arc(circleX, circleY, radius, 0, Math.PI * 2); // 画圆
      ctx.stroke(); // 描边
      console.log(`Drew blue circle at (${circleX}, ${circleY}) with radius ${radius}`);

      console.log("Drawing complete.");
    } else {
      console.error("Canvas context (ctx) or canvas itself is not ready for drawing.");
    }
  };

  render() {
    console.log("Rendering SimpleGCanvasApp...");
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.drawSimpleShapes}>
          <Text style={styles.welcome}>点我绘制简单图形</Text>
        </TouchableOpacity>

        {/* 只使用 GCanvasView */}
        <GCanvasView
          // 关键：设置 Canvas 创建的回调
          onCanvasCreate={this.initCanvas}
          // 提供样式，最好有明确的宽高
          style={styles.gcanvas}
          // 可以移除其他不必要的 props 来简化
          // onIsReady, isGestureResponsible, etc.
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center', // 居中可能会影响布局，暂时注释掉
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingTop: 50, // 留出顶部空间
  },
  gcanvas: {
    // **非常重要**：给 GCanvasView 一个明确的尺寸！
    // Release 包中，如果没有明确尺寸，布局计算可能失败或延迟，
    // 导致 this.canvas.width/height 在 initCanvas 时获取不到或为0.
    width: 300, 
    height: 400,
    // 或者使用百分比，但确保父容器有确定的大小
    // width: '90%',
    // height: '70%', 
    backgroundColor: '#E0E0E0', // 设置背景色方便看到画布区域
    marginBottom: 20, // 留出底部空间
  },
  welcome: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
});

// 注意：这个文件通常是 App.js 或类似名称。
// 你需要在项目的入口文件 (通常是 index.js) 中注册这个组件。
// 保持你 index.js 中的注册名称不变 ('gcanvas')！