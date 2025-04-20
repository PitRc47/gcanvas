import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PixelRatio,
  StatusBar,
  ScrollView,
  Button,
  TextInput, // 确保 TextInput 已导入
  Platform,
  Alert, // 用于显示错误提示
} from 'react-native';
import { GCanvasView } from '@flyskywhy/react-native-gcanvas';

// --- 默认的 WebSocket 服务器地址 (可用作输入框的初始值) ---
const DEFAULT_WEBSOCKET_URL = 'ws://10.0.2.2:8080'; // 示例: Android 模拟器本地地址

export default class FullScreenGCanvasApp extends Component {
  constructor(props) {
    super(props);
    this.canvas = null;
    this.ctx = null;
    this.ws = null; // WebSocket 实例
    this.scrollViewRef = React.createRef(); // 用于滚动消息列表

    this.state = {
      // GCanvas State
      canvasLogicalWidth: 0,
      canvasLogicalHeight: 0,
      isCanvasReady: false,

      // WebSocket State
      wsUrlInput: DEFAULT_WEBSOCKET_URL, // 输入框中的 URL，给个默认值
      activeWsUrl: null, // 当前连接的 URL
      isConnected: false,
      isConnecting: false, // 是否正在尝试连接
      messageToSend: '',
      receivedMessages: [],
    };
  }

  // --- React Lifecycle Methods ---

  // componentDidMount 不再自动连接

  componentWillUnmount() {
    console.log('ComponentWillUnmount: Closing WebSocket connection.');
    this.closeWebSocket();
  }

  // --- WebSocket Methods ---

  setupWebSocket = (urlToConnect) => {
    // 防止重复连接或在连接时再次连接
    if (this.state.isConnecting || this.state.isConnected) {
        // 可以选择先断开旧连接
        console.log('Already connecting or connected. Disconnecting previous connection first.');
        this.closeWebSocket(); // 先尝试关闭
        // 稍作延迟再尝试连接新的，确保旧的关闭完成
        setTimeout(() => this.attemptConnection(urlToConnect), 500);
        return;
    }
    this.attemptConnection(urlToConnect);
  };

  attemptConnection = (urlToConnect) => {
    // 基础的 URL 验证
    if (!urlToConnect || (!urlToConnect.startsWith('ws://') && !urlToConnect.startsWith('wss://'))) {
        Alert.alert('无效的 URL', '请输入以 ws:// 或 wss:// 开头的有效 WebSocket 地址');
        this.setState({ isConnecting: false }); // 确保重置连接中状态
        return;
    }

    console.log(`Attempting to connect to WebSocket: ${urlToConnect}`);
    this.setState({ isConnecting: true, isConnected: false, activeWsUrl: urlToConnect, receivedMessages: [] }); // 重置消息

    try {
      this.ws = new WebSocket(urlToConnect);
    } catch (error) {
       console.error('WebSocket creation failed:', error);
       Alert.alert('连接错误', `创建 WebSocket 连接失败: ${error.message}`);
       this.setState({ isConnecting: false, activeWsUrl: null });
       return;
    }


    this.ws.onopen = () => {
      console.log('WebSocket connection opened to:', urlToConnect);
      this.setState({ isConnected: true, isConnecting: false });
    };

    this.ws.onclose = (e) => {
      console.log('WebSocket connection closed', e.code, e.reason);
      // 只有当关闭的 URL 是当前 activeWsUrl 时才更新状态，防止旧连接的 onclose 干扰新连接
      if (this.ws && this.ws.url === this.state.activeWsUrl) {
          this.setState({ isConnected: false, isConnecting: false, activeWsUrl: null }); // 连接关闭后清空 active url
          this.ws = null; // 清理实例引用
      } else {
           console.log('Received close event for an old or irrelevant WebSocket instance.');
      }
      // 可选：添加自动重连逻辑（如果需要，但手动连接模式下可能不需要）
    };

    this.ws.onerror = (e) => {
      console.error('WebSocket error:', e.message);
      // 只有当出错的 URL 是当前 activeWsUrl 时才提示和更新状态
      if (this.ws && this.ws.url === this.state.activeWsUrl) {
          Alert.alert('连接错误', `WebSocket 连接出错: ${e.message || '未知错误'}`);
          // onerror 之后通常会触发 onclose，状态会在 onclose 中处理
          // 但为保险起见，也在此处设置状态
          this.setState({ isConnecting: false, isConnected: false, activeWsUrl: null });
           this.ws = null; // 清理实例引用
      } else {
          console.log('Received error event for an old or irrelevant WebSocket instance.');
      }
    };

    this.ws.onmessage = (e) => {
      // 检查消息是否来自当前活动的 WebSocket 连接
      if (this.ws && this.ws.url === this.state.activeWsUrl) {
          console.log('Received message:', e.data);
          this.setState(prevState => ({
            receivedMessages: [`Server: ${e.data}`, ...prevState.receivedMessages.slice(0, 49)],
          }), () => {
            // 滚动到底部
            this.scrollViewRef.current?.scrollToEnd({ animated: true });
          });
      } else {
          console.log('Received message from an old or inactive WebSocket connection. Ignoring.');
      }
    };
  }

  closeWebSocket = () => {
    if (this.ws) {
      console.log('Closing WebSocket explicitly.');
      this.ws.close();
      // onclose 事件处理器会处理状态更新
      // 但为了立即反馈，可以先设置
      this.setState({ isConnecting: false, isConnected: false });
    }
     // 无论 ws 实例是否存在，都清理 activeWsUrl
    this.setState({ activeWsUrl: null });
  };

  sendMessage = () => {
    const { isConnected, messageToSend } = this.state;
    if (this.ws && isConnected && messageToSend) {
      console.log('Sending message:', messageToSend);
      this.ws.send(messageToSend);
      this.setState(prevState => ({
        receivedMessages: [`Me: ${messageToSend}`, ...prevState.receivedMessages.slice(0, 49)],
        messageToSend: '',
      }), () => {
        this.scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    } else if (!isConnected) {
      Alert.alert('无法发送', 'WebSocket 未连接');
    } else if (!messageToSend) {
       console.warn('Cannot send empty message.');
    }
  };

  // --- Input Handlers ---
  handleUrlInputChange = (text) => {
    this.setState({ wsUrlInput: text });
  };

  handleMessageInputChange = (text) => {
    this.setState({ messageToSend: text });
  };

  // --- Button Handlers ---
  handleConnectPress = () => {
      const urlToConnect = this.state.wsUrlInput.trim(); // 去除首尾空格
      this.setupWebSocket(urlToConnect);
  };

  handleDisconnectPress = () => {
      this.closeWebSocket();
  };


  // --- GCanvas Methods (保持不变) ---
  initCanvas = (canvas) => {
    if (this.canvas) return;
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.setState({ isCanvasReady: true }, () => {
      if (this.state.canvasLogicalWidth > 0 && this.state.canvasLogicalHeight > 0) {
        this.setCanvasSize(this.state.canvasLogicalWidth, this.state.canvasLogicalHeight);
      }
    });
  };
  handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0 && (width !== this.state.canvasLogicalWidth || height !== this.state.canvasLogicalHeight)) {
      this.setState({ canvasLogicalWidth: width, canvasLogicalHeight: height }, () => {
        if (this.canvas && this.state.isCanvasReady) {
          this.setCanvasSize(width, height);
        }
      });
    }
  };
  setCanvasSize = (logicalWidth, logicalHeight) => {
      if (!this.canvas) return;
      const scale = PixelRatio.get();
      const physicalWidth = Math.round(logicalWidth * scale);
      const physicalHeight = Math.round(logicalHeight * scale);
      if (physicalWidth <= 0 || physicalHeight <= 0) return;
      if (this.canvas.width !== physicalWidth || this.canvas.height !== physicalHeight) {
            this.canvas.width = physicalWidth;
            this.canvas.height = physicalHeight;
            console.log(`Canvas buffer size set to physical: ${this.canvas.width}x${this.canvas.height}`);
      }
  }
  drawSimpleShapes = () => {
    if (!this.ctx || !this.canvas || !(this.canvas.width > 0 && this.canvas.height > 0)) {
        Alert.alert("错误", "Canvas 尚未准备好或尺寸无效。");
        return;
    }
    const ctx = this.ctx; const width = this.canvas.width; const height = this.canvas.height; const scale = PixelRatio.get();
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = 'lightblue'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'red'; ctx.fillRect(width * 0.1, height * 0.1, width * 0.3, height * 0.2);
    ctx.strokeStyle = 'blue'; ctx.lineWidth = 5 * scale; ctx.beginPath(); ctx.arc(width * 0.7, height * 0.6, width * 0.15, 0, Math.PI * 2); ctx.stroke();
    console.log("Drawing complete.");
  };

  // --- Render Method (Updated) ---

  render() {
    const {
        isConnected,
        isConnecting,
        activeWsUrl,
        wsUrlInput,
        messageToSend,
        receivedMessages
    } = this.state;

    let statusText = '未连接';
    if (isConnecting) {
        statusText = `正在连接到 ${activeWsUrl}...`;
    } else if (isConnected && activeWsUrl) {
        statusText = `已连接到 ${activeWsUrl}`;
    }

    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />

        {/* GCanvas View */}
        <GCanvasView
          style={styles.gcanvas}
          onCanvasCreate={this.initCanvas}
          onLayout={this.handleLayout}
        />

        {/* WebSocket UI Section */}
        <View style={styles.wsContainer}>
           {/* URL Input and Connect/Disconnect Buttons */}
          <View style={styles.connectionControlContainer}>
             <TextInput
              style={styles.urlInput}
              value={wsUrlInput}
              onChangeText={this.handleUrlInputChange}
              placeholder="输入 WebSocket URL (ws:// or wss://)"
              placeholderTextColor="#999"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              // 当连接中或已连接时，输入框可以设为不可编辑，防止误操作
              editable={!isConnecting && !isConnected}
            />
            <View style={styles.buttonRow}>
                <Button
                  title={isConnecting ? "连接中..." : "连接"}
                  onPress={this.handleConnectPress}
                  // 正在连接或已连接时禁用“连接”按钮
                  disabled={isConnecting || isConnected}
                />
                <View style={{ width: 10 }} /> {/* 按钮间距 */}
                <Button
                  title="断开连接"
                  onPress={this.handleDisconnectPress}
                  // 只有在连接中或已连接时才启用“断开连接”按钮
                  disabled={!isConnecting && !isConnected}
                  color="#FF6347" // 使用不同颜色区分
                />
            </View>
          </View>


          <Text style={styles.statusText}>{statusText}</Text>

          {/* Message Display Area */}
          <ScrollView
            style={styles.messagesContainer}
            ref={this.scrollViewRef} // 绑定 ref
            >
            {receivedMessages.map((msg, index) => (
              <Text key={index} style={styles.messageText}>{msg}</Text>
            ))}
          </ScrollView>

          {/* Input and Send Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={messageToSend}
              onChangeText={this.handleMessageInputChange}
              placeholder="输入消息..."
              placeholderTextColor="#999"
              editable={isConnected} // 只有连接时才能输入消息
            />
            <Button
              title="发送"
              onPress={this.sendMessage}
              disabled={!isConnected || !messageToSend} // 只有连接且有内容时才能发送
            />
          </View>
        </View>

        {/* Floating Draw Button - 可能需要调整位置 */}
        <TouchableOpacity onPress={this.drawSimpleShapes} style={styles.drawButton}>
          <Text style={styles.buttonText}>点我绘制</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

// --- Styles (Updated) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#333' },
  gcanvas: { flex: 1 },
  wsContainer: {
    // 保持在底部
    padding: 10,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#444',
    // 高度由内容决定，或者可以给一个 maxHeight
  },
  // --- 新增样式 ---
  connectionControlContainer: {
      marginBottom: 10,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#fff',
    color: '#000',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderRadius: 4,
    marginBottom: 8,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // 或 'center'
  },
  // --- /新增样式 ---
  statusText: { color: 'white', textAlign: 'center', marginBottom: 5, fontWeight: 'bold' },
  messagesContainer: {
    height: 100, // 可调整
    backgroundColor: '#222', borderRadius: 4, padding: 8, marginBottom: 10,
  },
  messageText: { color: '#eee', fontSize: 12, marginBottom: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#555', backgroundColor: '#fff', color: '#000',
    paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 10 : 5,
    borderRadius: 4, marginRight: 10, height: 40,
  },
  drawButton: {
    position: 'absolute',
    // ！！！可能需要根据 wsContainer 的实际高度调整 bottom 值 ！！！
    // 估算：URL输入+按钮+状态+消息框+消息输入 = 大约 60 + 30 + 20 + 100 + 40 + paddings = ~260+
    bottom: 280, // 尝试增加这个值
    left: '50%', width: 180, marginLeft: -90, paddingVertical: 12, paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.9)', borderRadius: 25, elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});