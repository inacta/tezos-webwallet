import pdfMake, { TCreatedPdf } from 'pdfmake/build/pdfmake';
import { Net } from '../shared/TezosTypes';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// TODO: Consider adding the mnemonic to the generated PDF
function getDocDefinition(address: string, net: Net, secretKey: string): pdfMake.TDocumentDefinitions {
  const docDefinition = {
    content: [
      {
        alignment: 'center',
        text: 'Tezos Secret Key',
        style: 'header',
        fontSize: 23,
        bold: true,
        margin: [0, 10]
      },
      {
        margin: [0, 0, 0, 10],
        layout: {
          fillColor: function(rowIndex: number) {
            return rowIndex % 2 === 0 ? '#ebebeb' : '#f5f5f5';
          }
        },
        table: {
          widths: ['100%'],
          heights: [20, 10],
          body: [
            [
              {
                text: 'This is the Secret key controlling your tokens from the inacta Token Gateway',
                fontSize: 9,
                bold: true
              }
            ],
            [
              {
                text:
                  'Warning: If you lose this secret key, you will lose access to the assets controlled by it. ' +
                  'We cannot help you recover it. There is no recourse, we cannot help you recover your assets if ' +
                  'you lose your key.',
                fontSize: 9,
                bold: true,
                color: 'red'
              }
            ]
          ]
        }
      },
      {
        alignment: 'center',
        text: `Secret key in base58: ${secretKey}\n\n\n\n`
      },
      {
        alignment: 'center',
        qr: `${secretKey}`
      },
      {
        alignment: 'center',
        text: 'Your key'
      },
      {
        alignment: 'center',
        margin: [0, 30, 0, 0],
        text: `This key controls address ${address} on ${net}\n\n\n`
      }
    ]
  };

  return docDefinition;
}

export function printPdf(address: string, net: Net, secretKey: string): TCreatedPdf {
  const docDefinition = getDocDefinition(address, net, secretKey);
  let pdf: pdfMake.TCreatedPdf;
  pdf = pdfMake.createPdf(docDefinition);
  return pdf;
}
