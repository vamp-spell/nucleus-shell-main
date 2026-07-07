import { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Input,
  Checkbox,
  InputNumber,
  Typography,
  Divider,
  Button,
  message,
  ConfigProvider,
  theme,
  Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  ADD_ON_CATALOGUE,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  selectionsEqual,
  type AddOn,
  type AddOnCategory,
  type SelectedAddOn,
} from '../data/addons';

const { Text } = Typography;
const { useToken } = theme;

interface AddOnsDrawerProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
  existingSelections: SelectedAddOn[];
  onUpdate: (selections: SelectedAddOn[]) => Promise<void>;
}

function AddOnsDrawerInner({
  orderId: _orderId,
  open,
  onClose,
  existingSelections,
  onUpdate,
}: AddOnsDrawerProps) {
  const { token } = useToken();
  const [messageApi, contextHolder] = message.useMessage();
  const [localSelections, setLocalSelections] = useState<SelectedAddOn[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  // Clone selections on open
  useEffect(() => {
    if (open) {
      setLocalSelections(existingSelections.map((s) => ({ ...s })));
      setSearchQuery('');
    }
  }, [open]);

  const hasChanges = !selectionsEqual(localSelections, existingSelections);

  const total = useMemo(
    () =>
      localSelections.reduce((sum, s) => {
        const addon = ADD_ON_CATALOGUE.find((a) => a.id === s.addOnId);
        return sum + (addon?.pricePerUnit ?? 0) * s.quantity;
      }, 0),
    [localSelections]
  );

  const selectedCount = localSelections.length;

  const toggleAddOn = (addOnId: string) => {
    setLocalSelections((prev) => {
      const exists = prev.find((s) => s.addOnId === addOnId);
      if (exists) return prev.filter((s) => s.addOnId !== addOnId);
      return [...prev, { addOnId, quantity: 1 }];
    });
  };

  const updateQuantity = (addOnId: string, qty: number | null) => {
    const quantity = qty ?? 1;
    if (quantity <= 0) {
      setLocalSelections((prev) => prev.filter((s) => s.addOnId !== addOnId));
      return;
    }
    setLocalSelections((prev) =>
      prev.map((s) => (s.addOnId === addOnId ? { ...s, quantity } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(localSelections);
      messageApi.success('Add-ons updated');
      onClose();
    } catch {
      messageApi.error('Could not update add-ons — try again');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalSelections(existingSelections.map((s) => ({ ...s })));
    onClose();
  };

  // Filter catalogue by search
  const q = searchQuery.trim().toLowerCase();
  const filteredByCategory: Partial<Record<AddOnCategory, AddOn[]>> = {};
  for (const cat of CATEGORY_ORDER) {
    const items = ADD_ON_CATALOGUE.filter(
      (a) => a.category === cat && (!q || a.name.toLowerCase().includes(q))
    );
    if (items.length > 0) filteredByCategory[cat] = items;
  }
  const hasAnyResults = Object.keys(filteredByCategory).length > 0;

  return (
    <>
      {contextHolder}
      <Drawer
        title="Add-ons"
        placement="right"
        width={420}
        open={open}
        onClose={handleCancel}
        maskClosable={false}
        destroyOnClose={false}
        styles={{
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          },
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              disabled={!hasChanges}
              loading={saving}
              onClick={handleSave}
            >
              Update add-ons
            </Button>
          </div>
        }
      >
        {/* Search */}
        <div style={{ padding: '12px 16px 0' }}>
          <Input.Search
            placeholder="Search add-ons"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: '100%' }}
          />
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
          {!hasAnyResults ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 16px',
                gap: 8,
              }}
            >
              <Text type="secondary" style={{ fontSize: 13 }}>
                No add-ons match your search.
              </Text>
              <Button
                type="link"
                size="small"
                onClick={() => setSearchQuery('')}
                style={{ fontSize: 12 }}
              >
                Clear search
              </Button>
            </div>
          ) : (
            CATEGORY_ORDER.filter((cat) => filteredByCategory[cat]).map((cat, idx) => {
              const items = filteredByCategory[cat]!;
              return (
                <div key={cat}>
                  {idx === 0 ? (
                    <Divider style={{ margin: '12px 0 4px' }} />
                  ) : (
                    <Divider style={{ margin: '4px 0' }} />
                  )}
                  {/* Category header */}
                  <div style={{ padding: '2px 16px 6px' }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 500,
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </div>
                  {/* Add-on rows */}
                  {items.map((addon) => (
                    <AddOnRow
                      key={addon.id}
                      addon={addon}
                      selection={localSelections.find((s) => s.addOnId === addon.id)}
                      onToggle={() => toggleAddOn(addon.id)}
                      onQuantityChange={(qty) => updateQuantity(addon.id, qty)}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Running total */}
        <div
          style={{
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorFillTertiary,
            padding: '10px 16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Total add-ons</Text>
            <Text strong style={{ fontSize: 14 }}>
              ₹{total.toLocaleString('en-IN')}
            </Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {selectedCount} add-on{selectedCount !== 1 ? 's' : ''} selected
            </Text>
          </div>
        </div>
      </Drawer>
    </>
  );
}

function AddOnRow({
  addon,
  selection,
  onToggle,
  onQuantityChange,
}: {
  addon: AddOn;
  selection: SelectedAddOn | undefined;
  onToggle: () => void;
  onQuantityChange: (qty: number | null) => void;
}) {
  const { token } = useToken();
  const checked = !!selection;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        padding: '0 16px',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = token.colorFillSecondary;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
      onClick={onToggle}
    >
      {/* Left: checkbox + name + info */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox checked={checked} onChange={onToggle} />
        <Text style={{ fontSize: 13 }}>{addon.name}</Text>
        {addon.description && (
          <Tooltip title={addon.description} placement="right">
            <InfoCircleOutlined
              style={{ fontSize: 14, color: token.colorTextTertiary, flexShrink: 0 }}
            />
          </Tooltip>
        )}
      </div>

      {/* Right: qty + price */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {addon.isQuantifiable && (
          <InputNumber
            min={1}
            max={99}
            size="small"
            value={selection?.quantity ?? 1}
            disabled={!checked}
            onChange={onQuantityChange}
            style={{
              width: 60,
              opacity: checked ? 1 : 0.35,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {addon.pricePerUnit > 0 && (
          <Text type="secondary" style={{ fontSize: 12, minWidth: 48, textAlign: 'right' }}>
            ₹{addon.pricePerUnit.toLocaleString('en-IN')}
          </Text>
        )}
      </div>
    </div>
  );
}

export default function AddOnsDrawer(props: AddOnsDrawerProps) {
  return (
    <ConfigProvider>
      <AddOnsDrawerInner {...props} />
    </ConfigProvider>
  );
}
