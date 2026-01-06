/**
 * 拨号面板组件 - 紧凑型
 */
import { useState } from 'react'
import { Modal, Button, Input, Space } from 'antd'
import { PhoneOutlined, DeleteOutlined } from '@ant-design/icons'

interface DialerPanelProps {
  visible: boolean
  onCall: (number: string) => void
  onClose: () => void
}

function DialerPanel({ visible, onCall, onClose }: DialerPanelProps) {
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleDigitClick = (digit: string) => {
    setPhoneNumber((prev) => prev + digit)
  }

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPhoneNumber('')
  }

  const handleCall = () => {
    if (phoneNumber.trim()) {
      onCall(phoneNumber.trim())
      setPhoneNumber('')
      onClose()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCall()
    }
  }

  return (
    <Modal
      title="拨号"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={240}
      centered
      styles={{ body: { padding: 16 } }}
    >
      {/* 号码输入框 */}
      <div style={{ marginBottom: 10 }}>
        <Input
          value={phoneNumber}
          placeholder="请输入号码"
          onChange={(e) => setPhoneNumber(e.target.value)}
          onKeyPress={handleKeyPress}
          suffix={
            <DeleteOutlined
              onClick={handleClear}
              style={{ 
                cursor: phoneNumber ? 'pointer' : 'default',
                fontSize: 12,
                opacity: phoneNumber ? 1 : 0,
                visibility: phoneNumber ? 'visible' : 'hidden',
                pointerEvents: phoneNumber ? 'auto' : 'none'
              }}
            />
          }
          style={{ fontSize: 15, textAlign: 'center' }}
        />
      </div>

      {/* 拨号盘 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 10 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
          <Button
            key={digit}
            onClick={() => handleDigitClick(digit)}
            style={{ height: 36, fontSize: 15, padding: 0 }}
          >
            {digit}
          </Button>
        ))}
      </div>

      {/* 操作按钮 */}
      <Space style={{ width: '100%' }} direction="vertical" size="small">
        <Button
          type="primary"
          icon={<PhoneOutlined />}
          onClick={handleCall}
          disabled={!phoneNumber.trim()}
          block
          size="small"
        >
          呼叫
        </Button>
        <Button onClick={handleDelete} block size="small">
          删除
        </Button>
      </Space>
    </Modal>
  )
}

export default DialerPanel

