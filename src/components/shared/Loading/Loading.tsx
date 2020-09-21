import React from 'react';

interface ILoadingProps {
  large?: boolean;
  center?: boolean;
  children?: JSX.Element | string;
}

export default function Loading(props: ILoadingProps) {
  const loadingIcon = (
    <div
      className="d-flex flex-column justify-content-center h-100"
      style={{ minWidth: props.large ? '150px' : '30px' }}
    >
      <img src="/assets/img/logo_animated.svg" style={{ maxHeight: props.large ? '150px' : '30px' }} alt="" />
      {props.children === undefined ? (
        <div></div>
      ) : props.large ? (
        <h2 className="align-self-center mt-3">{props.children}</h2>
      ) : (
        <span className="align-self-center mt-1">{props.children}</span>
      )}
    </div>
  );

  return props.center === undefined || props.center ? (
    loadingIcon
  ) : (
    <div className={'d-flex justify-content-start py-2'}>{loadingIcon}</div>
  );
}
