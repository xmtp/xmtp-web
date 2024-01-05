import "./Notification.css";

type NotificationProps = React.PropsWithChildren & {
  cta?: React.ReactNode;
  icon: React.ReactNode;
  title: string;
};

export const Notification: React.FC<NotificationProps> = ({
  children,
  cta,
  icon,
  title,
}) => (
  <div className="NotificationWrapper">
    <div className="Notification">
      <div className="Notification__icon">{icon}</div>
      <div className="Notification__title">{title}</div>
      <div className="Notification__message">{children}</div>
      {cta && <div className="Notification__cta">{cta}</div>}
    </div>
  </div>
);
