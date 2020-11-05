import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import React from 'react';
import Tooltip from 'react-bootstrap/Tooltip';

interface IIconButton {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: JSX.Element;
  overlay?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export default function IconButton(props: IIconButton) {
  const button = (
    <button className="icon-button" onClick={props.onClick}>
      <div>{props.children}</div>
    </button>
  );

  if (props.overlay) {
    return (
      <OverlayTrigger
        placement={props.placement ?? 'top'}
        overlay={<Tooltip id={'tooltip-' + props.overlay}>{props.overlay}</Tooltip>}
      >
        {button}
      </OverlayTrigger>
    );
  }
  return button;
}
