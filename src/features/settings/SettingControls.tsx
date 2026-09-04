import type { ReactNode } from 'react'
import { Metric } from '../../components/Metric/Metric'
import type { MetricEdit } from '../../components/Metric/Metric'

export function SettingsRow({ label, control, description, wide }: { label: string; control: ReactNode; description?: string; wide?: boolean }) {
  return (
    <div className={`settings-row${wide ? ' settings-row--wide' : ''}`}>
      <div className="settings-row__label">{label}</div>
      <div className="settings-row__control">{control}</div>
      {description && <p className="settings-row__description">{description}</p>}
    </div>
  )
}

export function StepperRow({ label, value, unit, edit }: { label: string; value: string; unit?: string; edit?: MetricEdit }) {
  return (
    <div className="settings-row">
      <Metric
        metric={{ label, value, unit }}
        edit={edit}
      />
    </div>
  )
}

export function ToggleRow({ label, description, checked, disabled, onChange }: { label: string; description?: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <SettingsRow
      label={label}
      wide
      description={description}
      control={
        <button
          className={`settings-toggle${checked ? ' settings-toggle--on' : ''}`}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
        >
          <span />
        </button>
      }
    />
  )
}

export function SelectRow({ label, description, value, options, disabled, onChange }: { label: string; description?: string; value: string; options: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <SettingsRow
      label={label}
      wide
      description={description}
      control={
        <select
          className="settings-select"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      }
    />
  )
}

export function ButtonRow({ label, description, children, disabled, onAction }: { label: string; description?: string; children: ReactNode; disabled?: boolean; onAction?: () => void }) {
  return (
    <SettingsRow
      label={label}
      wide
      description={description}
      control={
        <button className="settings-section__button" type="button" disabled={disabled} onClick={onAction}>
          {children}
        </button>
      }
    />
  )
}

export function StatusRow({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="status-info">
      <p className="status-info__label">{label}</p>
      <p className="status-info__value">{value}</p>
      {sub && <p className="settings-row__description">{sub}</p>}
    </div>
  )
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="settings-section">
      <h2 className="settings-section__title">{title}</h2>
      <div className="settings-section__content">
        <div className="status-info">
          <p className="status-info__label">Status</p>
          <p className="status-info__value">Coming soon</p>
        </div>
        <p className="settings-row__description">
          This setting will be available here in a future update.
        </p>
      </div>
    </section>
  )
}

export function PageFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="settings-page">
      <h2 className="settings-page__title">{title}</h2>
      <div className="settings-page__body">{children}</div>
    </div>
  )
}