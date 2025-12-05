import { Layout, Typography, Card, Row, Col } from 'antd'
import { ToolOutlined, CodeOutlined, ExperimentOutlined } from '@ant-design/icons'

const { Header, Content } = Layout
const { Title, Paragraph } = Typography
const { Meta } = Card

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          Workbench 工作台
        </Title>
      </Header>
      <Content style={{ padding: '50px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <Title level={1}>欢迎使用 Workbench 工作台</Title>
          <Paragraph style={{ fontSize: '16px' }}>
            这是 Workbench 项目的首页
          </Paragraph>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              cover={
                <div style={{ padding: '40px', textAlign: 'center', fontSize: '48px' }}>
                  <ToolOutlined />
                </div>
              }
            >
              <Meta title="工具集" description="各种实用工具和功能" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              cover={
                <div style={{ padding: '40px', textAlign: 'center', fontSize: '48px' }}>
                  <CodeOutlined />
                </div>
              }
            >
              <Meta title="代码编辑器" description="强大的代码编辑功能" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: '100%' }}
              cover={
                <div style={{ padding: '40px', textAlign: 'center', fontSize: '48px' }}>
                  <ExperimentOutlined />
                </div>
              }
            >
              <Meta title="实验功能" description="探索和测试新功能" />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}

export default App

