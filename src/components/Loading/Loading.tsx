import React from 'react';

interface ILoadingProps {
  large?: boolean;
}

export default function Loading(props: ILoadingProps) {
  return (
    <div className="p-4 d-flex justify-content-center flex-column h-100">
      <img src="/assets/img/logo_animated.svg" style={{ maxHeight: props.large ? '200px' : '30px' }} />
    </div>
  );
}
