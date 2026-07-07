import { Dropdown, Modal, Tooltip, message } from 'antd';
import {
  CheckOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  SyncOutlined,
  EditOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ApplicationStatus } from '../data/orderDetails';

export const STATUS_ORDER: ApplicationStatus[] = [
  'created', 'in_progress', 'ready_to_submit', 'submitting', 'awaiting_result', 'completed',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  created: 'Created',
  in_progress: 'In progress',
  ready_to_submit: 'Ready to submit',
  submitting: 'Submitting',
  awaiting_result: 'Awaiting result',
  completed: 'Completed',
  void: 'Void',
};

const STATUS_STYLE: Record<ApplicationStatus, { bg: string; color: string }> = {
  created: { bg: '#F1EFE8', color: '#888886' },
  in_progress: { bg: '#E6F4FF', color: '#0958D9' },
  ready_to_submit: { bg: '#FFFBE6', color: '#D48806' },
  submitting: { bg: '#E6F4FF', color: '#0958D9' },
  awaiting_result: { bg: '#E6F4FF', color: '#0958D9' },
  completed: { bg: '#F6FFED', color: '#389E0D' },
  void: { bg: '#F1EFE8', color: '#AAAAAA' },
};

function StatusPrefix({ status }: { status: ApplicationStatus }) {
  if (status === 'submitting') return <LoadingOutlined style={{ fontSize: 11 }} />;
  if (status === 'awaiting_result') return <SyncOutlined style={{ fontSize: 11 }} />;
  if (status === 'completed') return <CheckCircleOutlined style={{ fontSize: 11 }} />;
  return null;
}

interface StatusCellProps {
  travellerId: string;
  travellerName: string;
  status: ApplicationStatus;
  manualStatus?: { by: string; at: string };
  onStatusChange: (travellerId: string, newStatus: ApplicationStatus) => void;
}

export default function StatusCell({ travellerId, travellerName, status, manualStatus, onStatusChange }: StatusCellProps) {
  const [messageApi, contextHolder] = message.useMessage();
  // suppress unused variable warning — contextHolder is needed for the message API to work
  void messageApi;

  const style = STATUS_STYLE[status];
  const isVoid = status === 'void';

  // If voided, show restore button instead of dropdown
  if (isVoid) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {contextHolder}
        <span style={{
          fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 4,
          background: style.bg, color: style.color,
          textDecoration: 'line-through',
        }}>
          Void
        </span>
        <button
          type="button"
          onClick={() => onStatusChange(travellerId, 'created')}
          style={{
            fontSize: 10, color: '#0958D9', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 4px', borderRadius: 3,
          }}
        >
          Restore
        </button>
      </div>
    );
  }

  function requestStatusChange(newStatus: ApplicationStatus) {
    if (newStatus === status) return;

    const currentIdx = STATUS_ORDER.indexOf(status);
    const newIdx = STATUS_ORDER.indexOf(newStatus);
    const isBackward = newIdx < currentIdx && newStatus !== 'void';
    const isVoidTarget = newStatus === 'void';

    const apply = () => {
      onStatusChange(travellerId, newStatus);
      // Simulate API save
      setTimeout(() => {
        // success (no revert in demo)
      }, 800);
    };

    if (isVoidTarget) {
      Modal.confirm({
        title: 'Void this application?',
        content: `This marks ${travellerName}'s application as void. This action is reversible — you can change the status again if needed.`,
        okText: 'Void application',
        okType: 'danger',
        cancelText: 'Cancel',
        centered: true,
        onOk: apply,
      });
      return;
    }

    if (isBackward) {
      Modal.confirm({
        title: 'Change status?',
        content: `Moving from '${STATUS_LABELS[status]}' back to '${STATUS_LABELS[newStatus]}' will not undo any completed actions (drafts, submissions). Are you sure?`,
        okText: 'Change status',
        cancelText: 'Keep current status',
        centered: true,
        onOk: apply,
      });
      return;
    }

    apply();
  }

  // Build menu items
  const forwardItems = STATUS_ORDER.filter(s => s !== status).map(s => {
    const currentIdx = STATUS_ORDER.indexOf(status);
    const sIdx = STATUS_ORDER.indexOf(s);
    const isBackward = sIdx < currentIdx;
    const isCurrent = s === status;
    return {
      key: s,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, minWidth: 160 }}>
          <span style={{ fontSize: 12, color: isBackward ? '#D48806' : undefined }}>
            {isBackward && <WarningOutlined style={{ marginRight: 6, fontSize: 11, color: '#D48806' }} />}
            {STATUS_LABELS[s]}
          </span>
          {isCurrent && <CheckOutlined style={{ fontSize: 11, color: '#52C41A' }} />}
        </div>
      ),
      onClick: () => requestStatusChange(s),
      disabled: isCurrent,
    };
  });

  // Current item at top
  const currentItem = {
    key: status,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, minWidth: 160 }}>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{STATUS_LABELS[status]}</span>
        <CheckOutlined style={{ fontSize: 11, color: '#52C41A' }} />
      </div>
    ),
    disabled: true,
  };

  const voidItem = {
    key: 'void',
    label: (
      <span style={{ fontSize: 12, color: '#FF4D4F' }}>Void</span>
    ),
    onClick: () => requestStatusChange('void'),
    danger: true,
  };

  const menuItems = [
    currentItem,
    ...forwardItems,
    { type: 'divider' as const },
    voidItem,
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {contextHolder}
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomLeft"
      >
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 4,
            background: style.bg, color: style.color,
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <StatusPrefix status={status} />
          {STATUS_LABELS[status]}
        </div>
      </Dropdown>
      {manualStatus && (
        <Tooltip title={`Manually set by ${manualStatus.by} on ${manualStatus.at}`} placement="top">
          <EditOutlined style={{ fontSize: 11, color: '#AAAAAA', cursor: 'default' }} />
        </Tooltip>
      )}
    </div>
  );
}
