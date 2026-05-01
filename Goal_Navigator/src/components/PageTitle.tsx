import { ReactNode } from "react";

interface PageTitleProps {
  /** Small uppercase eyebrow above the title */
  breadcrumb?: string;
  /** Main page title (h1) */
  title: string;
  /** Optional descriptive subtitle */
  subtitle?: ReactNode;
  /** Right-aligned controls (filters, actions, period picker, etc.) */
  controls?: ReactNode;
  /** Optional inline element after the title (e.g. status badge) */
  afterTitle?: ReactNode;
  className?: string;
}

/**
 * Unified page header — single source of truth for titles across the app.
 * Use INSIDE a page below <PageHeader/> (the brand bar). Replaces the
 * ad-hoc `<h1 className="text-xl ...">` blocks each view used to render.
 */
export function PageTitle({
  breadcrumb,
  title,
  subtitle,
  controls,
  afterTitle,
  className = "",
}: PageTitleProps) {
  return (
    <div className={`page-header-row ${className}`}>
      <div className="page-header-text">
        {breadcrumb && <div className="page-breadcrumb">{breadcrumb}</div>}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="page-title">{title}</h1>
          {afterTitle}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {controls && <div className="page-header-controls">{controls}</div>}
    </div>
  );
}
