import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PixelRatio,
  StatusBar,
} from 'react-native';
import { GCanvasView } from '@flyskywhy/react-native-gcanvas';

// 将类名更改为更具描述性的名称
export default class FullScreenGCanvasApp extends Component {
  constructor(props) {
    super(props);
    this.canvas = null;
    this.ctx = null;
    // 使用 state 来存储布局尺寸和 Canvas 准备状态
    this.state = {
      canvasLogicalWidth: 0,  // 存储逻辑宽度 (来自 onLayout)
      canvasLogicalHeight: 0, // 存储逻辑高度 (来自 onLayout)
      isCanvasReady: false,   // 标记 canvas 对象是否已创建
    };
    console.log("FullScreenGCanvasApp constructor called");
  }

  /**
   * GCanvasView 创建时的回调函数
   * @param {object} canvas - GCanvas 对象实例
   */
  initCanvas = (canvas) => {
    if (this.canvas) {
      console.log("Canvas instance already received via onCanvasCreate.");
      return;
    }
    console.log("onCanvasCreate: Canvas instance received.");
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.setState({ isCanvasReady: true }, () => {
      // 在 state 更新后检查：如果此时布局尺寸也已经有了，就设置 Canvas 尺寸
      if (this.state.canvasLogicalWidth > 0 && this.state.canvasLogicalHeight > 0) {
        console.log("onCanvasCreate callback: Canvas ready and layout dimensions available. Setting canvas buffer size.");
        this.setCanvasSize(this.state.canvasLogicalWidth, this.state.canvasLogicalHeight);
        // 可以在这里进行首次绘制，如果需要的话
        // this.drawSimpleShapes();
      } else {
        console.log("onCanvasCreate callback: Canvas ready, waiting for onLayout to provide dimensions.");
      }
    });
  };

  /**
   * GCanvasView 布局变化时的回调函数
   * @param {object} event - 布局事件对象
   */
  handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    console.log(`onLayout: Detected layout dimensions (logical): ${width}x${height}`);

    // 仅在尺寸有效且与当前 state 中的尺寸不同时进行更新
    if (width > 0 && height > 0 && (width !== this.state.canvasLogicalWidth || height !== this.state.canvasLogicalHeight)) {
      console.log("onLayout: Layout dimensions changed or initialized. Updating state.");
      // 更新 state 中的逻辑宽高
      this.setState({ canvasLogicalWidth: width, canvasLogicalHeight: height }, () => {
        // 在 state 更新后检查：如果此时 Canvas 实例也已经准备好了，就设置 Canvas 尺寸
        if (this.canvas && this.state.isCanvasReady) {
          console.log("onLayout callback: Layout updated and canvas ready. Setting canvas buffer size.");
          this.setCanvasSize(width, height);
          // 可选：每次布局变化（如屏幕旋转）时自动重绘内容
          // this.drawSimpleShapes();
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

  /**
   * 设置 Canvas 的物理绘图缓冲区尺寸
   * @param {number} logicalWidth - 逻辑宽度 (来自 onLayout)
   * @param {number} logicalHeight - 逻辑高度 (来自 onLayout)
   */
  setCanvasSize = (logicalWidth, logicalHeight) => {
      if (!this.canvas) {
          console.error("setCanvasSize Error: Cannot set size because canvas instance is null.");
          return;
      }
      const scale = PixelRatio.get(); // 获取当前设备的像素密度
      const physicalWidth = Math.round(logicalWidth * scale); // 转换为物理像素，取整避免小数
      const physicalHeight = Math.round(logicalHeight * scale);

      // 检查计算出的物理尺寸是否有效
      if (physicalWidth <= 0 || physicalHeight <= 0) {
          console.error(`setCanvasSize Error: Calculated invalid physical dimensions ${physicalWidth}x${physicalHeight} from logical ${logicalWidth}x${logicalHeight} and scale ${scale}. Aborting size set.`);
          return;
      }

      // 只有当物理尺寸确实发生变化时才更新，避免不必要的重绘和性能损耗
      if (this.canvas.width !== physicalWidth || this.canvas.height !== physicalHeight) {
            this.canvas.width = physicalWidth;
            this.canvas.height = physicalHeight;
            console.log(`setCanvasSize: Canvas buffer size set to physical: ${this.canvas.width}x${this.canvas.height} (based on logical: ${logicalWidth}x${logicalHeight}, scale: ${scale})`);
      } else {
          console.log(`setCanvasSize: Canvas buffer size ${this.canvas.width}x${this.canvas.height} is already up-to-date.`);
      }
  }

  /**
   * 绘制简单图形的函数
   * （注意：绘制坐标和尺寸现在基于 this.canvas.width/height，即物理像素）
   */
  drawSimpleShapes = () => {
    // 绘制前进行严格检查
    if (!this.ctx) {
        console.error("drawSimpleShapes Error: Canvas context (ctx) is not available.");
        return;
    }
    if (!this.canvas) {
        console.error("drawSimpleShapes Error: Canvas instance is not available.");
        return;
    }
     // 确保 Canvas 的物理尺寸已经被设置并且是有效的
    if (!(this.canvas.width > 0 && this.canvas.height > 0)) {
        console.error(`drawSimpleShapes Error: Canvas physical dimensions (${this.canvas.width}x${this.canvas.height}) are invalid or not yet set. Cannot draw.`);
        // 也许提示用户稍后再试，或者尝试强制获取布局？（通常不推荐）
        alert("Canvas 尺寸尚未就绪，请稍后再试。");
        return;
    }

    console.log(`Drawing simple shapes on canvas with physical size: ${this.canvas.width}x${this.canvas.height}`);
    const ctx = this.ctx;
    const width = this.canvas.width;   // 使用物理像素宽度
    const height = this.canvas.height; // 使用物理像素高度
    const scale = PixelRatio.get();    // 获取像素密度，用于调整线宽等

    // 1. 清空整个画布
    ctx.clearRect(0, 0, width, height);

    // 2. 绘制一个覆盖全屏的浅蓝色背景（可选）
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, width, height);
    console.log(`Drew lightblue background covering ${width}x${height}`);

    // 3. 绘制一个红色填充矩形 (坐标和尺寸相对于物理像素)
    ctx.fillStyle = 'red';
    const rectX = width * 0.1;
    const rectY = height * 0.1;
    const rectWidth = width * 0.3;
    const rectHeight = height * 0.2;
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    console.log(`Drew red rect at (${rectX.toFixed(2)}, ${rectY.toFixed(2)}) size ${rectWidth.toFixed(2)}x${rectHeight.toFixed(2)}`);

    // 4. 绘制一个蓝色描边圆形 (坐标和尺寸相对于物理像素)
    ctx.strokeStyle = 'blue';
    // 线宽最好也根据像素密度调整，使其在不同设备上看起来粗细一致
    ctx.lineWidth = 5 * scale;
    ctx.beginPath(); // 开始新路径，非常重要！
    const circleX = width * 0.7; // 调整位置避免重叠
    const circleY = height * 0.6; // 调整位置避免重叠
    const radius = width * 0.15;
    // arc(圆心x, 圆心y, 半径, 起始角, 结束角)
    ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
    ctx.stroke(); // 执行描边
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
    flex: 1, // 核心：让容器填满父视图（通常是整个屏幕）
    backgroundColor: '#333', // 给容器加个深色背景，方便看到 Canvas 区域
    // 移除 alignItems 和 paddingTop/paddingBottom 等可能影响全屏的样式
  },
  gcanvas: {
    flex: 1, // 核心：让 GCanvasView 自动伸展以填充 container
    // 不需要设置 width 或 height，flex: 1 会处理
    // 可以加个临时背景色调试布局是否正确
    // backgroundColor: 'rgba(255, 255, 0, 0.5)', // 半透明黄色背景
  },
  // 将按钮样式改为浮动按钮，避免占用布局空间
  drawButton: {
    position: 'absolute', // 使用绝对定位
    bottom: 40,          // 距离屏幕底部 40 像素
    // 水平居中技巧：left 50% 然后用 marginLeft 负的宽度一半
    left: '50%',
    width: 180,          // 按钮宽度
    marginLeft: -90,     // 宽度的一半
    paddingVertical: 12, // 上下内边距
    paddingHorizontal: 20, // 左右内边距
    backgroundColor: 'rgba(0, 122, 255, 0.9)', // 带透明度的蓝色背景
    borderRadius: 25,     // 圆角效果
    elevation: 5,         // Android 阴影
    shadowColor: '#000',  // iOS 阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    alignItems: 'center', // 按钮内文字居中
  },
  buttonText: {
    color: 'white',       // 文字颜色
    fontSize: 16,         // 文字大小
    fontWeight: 'bold',   // 文字加粗
  },
});

// 确保你的应用入口文件 (如 index.js 或 App.js) 注册的是这个组件：
// AppRegistry.registerComponent('YourProjectName', () => FullScreenGCanvasApp);