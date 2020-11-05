import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy } from 'react-icons/fa';
import IconButton from '../../../shared/IconButton/IconButton';
import { IoMdSwap } from 'react-icons/io';
import React from 'react';
import { addNotification } from '../../../../shared/NotificationService';

interface IAddressComponent {
  address: string;
  resetSigner: () => void;
}

export default function AddressComponent(props: IAddressComponent) {
  return (
    <div>
      <h4>Your Address</h4>
      <h5>
        <span className="mr-1">{props.address}</span>
        <CopyToClipboard
          text={props.address}
          onCopy={() => addNotification('success', 'Successfully copied address: ' + props.address)}
        >
          <IconButton onClick={() => {}} overlay="Copy">
            <FaCopy />
          </IconButton>
        </CopyToClipboard>
        <IconButton onClick={() => props.resetSigner()} overlay="Switch account">
          <IoMdSwap />
        </IconButton>
      </h5>
      <hr />
    </div>
  );
}
