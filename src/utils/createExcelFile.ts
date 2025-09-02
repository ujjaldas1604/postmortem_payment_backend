import xlsx from 'xlsx';
import logger from '../config/winston_logger';

const createXlsxFile = (data: any) => {
    try {
        // logger.info(`Creating excel file, ${JSON.stringify(data)}`);
        const workbook = xlsx.utils.book_new();

        const worksheet = xlsx.utils.aoa_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // Adjust column widths
        const colWidths = data[0].map((_: any, colIndex: any) => ({
            wch: Math.max(...data.map((row: any) => (row[colIndex] ? row[colIndex].toString().length + 3 : 0)))
        }));
        worksheet['!cols'] = colWidths;

        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        logger.info(`Excel buffer successfully created`);
        return excelBuffer;
    } catch (err: any) {
        logger.error(`Error in createXlsxFile: ${err}`);
        throw err;
    }
};

export default createXlsxFile;
