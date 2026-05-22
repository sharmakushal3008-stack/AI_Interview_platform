const { PDFParse } = require('pdf-parse');
const parser = new PDFParse();
console.log('PDFParse type:', typeof PDFParse);
console.log('parser.pdf type:', typeof parser.pdf);
console.log('SUCCESS - ready to use');
