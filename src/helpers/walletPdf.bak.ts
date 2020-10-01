import { Net } from '../shared/TezosTypes';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import pdfMake from 'pdfmake/build/pdfmake';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// TODO: Consider adding the mnemonic to the generated PDF
function getDocDefinition(
  address: string,
  confirmationToken: string,
  net: Net,
  secretKey: string
): pdfMake.TDocumentDefinitions {
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
          fillColor: function(rowIndex: number): string {
            return rowIndex % 2 === 0 ? '#ebebeb' : '#f5f5f5';
          }
        },
        table: {
          widths: ['100%'],
          heights: [20, 10],
          body: [
            [
              {
                text: 'This is the Secret key controlling your tokens from inacta Token Gateway',
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
        text: `Secret key in base58: ${secretKey}\n\n\n\n`
      },
      {
        text: `This key controls address ${address} on ${net}\n\n\n`
      },
      {
        text: 'Confirmation token'
      },
      {
        alignment: 'right',
        fontsize: 18,
        layout: {
          defaultBorder: false
        },
        style: 'tableExample',
        table: {
          body: [
            [
              {
                border: [true, true, true, true],
                fillColor: '#eeeeff',
                text: confirmationToken
              }
            ]
          ]
        }
      }
    ]
  };

  return docDefinition;
}

export function printPdf(address: string, confirmationToken: string, net: Net, secretKey: string): void {
  const docDefinition = getDocDefinition(address, confirmationToken, net, secretKey);
  let pdf: pdfMake.TCreatedPdf;
  pdf = pdfMake.createPdf(docDefinition);
  pdf.download(`TezosSecretKeyFor${address}.pdf`, (): void => {
    //var win = window.open('', '_blank');
    pdf.print({});
  });
}
