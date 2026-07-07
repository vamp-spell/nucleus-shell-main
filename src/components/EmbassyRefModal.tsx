import { useState, useEffect } from 'react';
import { Modal, Input, Typography, Button, message } from 'antd';

const { Text } = Typography;

interface EmbassyRefModalProps {
  open: boolean;
  existing: string;
  orderId: string;
  travellerId: string;
  travellerName: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export default function EmbassyRefModal({ open, existing, travellerName, onClose, onSave }: EmbassyRefModalProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) setValue(existing);
  }, [open, existing]);

  async function handleSave() {
    if (!value.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    onSave(value.trim());
    messageApi.success('Embassy ref ID saved');
    onClose();
  }

  return (
    <>
      {contextHolder}
      <Modal
        title={existing ? 'Edit embassy reference ID' : 'Add embassy reference ID'}
        open={open}
        onCancel={onClose}
        width={400}
        centered
        maskClosable={false}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={onClose}>Cancel</Button>,
          <Button
            key="save"
            type="primary"
            disabled={!value.trim()}
            loading={saving}
            onClick={handleSave}
          >
            Save
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Saving for: <strong>{travellerName}</strong>
          </Text>
          <Input
            autoFocus
            size="large"
            value={value}
            onChange={e => setValue(e.target.value)}
            onPaste={e => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('text').trim();
              setValue(pasted);
            }}
            placeholder="Enter embassy reference ID"
            onPressEnter={handleSave}
          />
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
            Copy this from the embassy portal after submission. This ID is used to track the application status.
          </Text>
        </div>
      </Modal>
    </>
  );
}
