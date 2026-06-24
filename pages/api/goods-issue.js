
import fs from 'fs';
import path from 'path';

// Helper function to format numbers to a specific length, padding with leading zeros
const formatNumber = (num, length) => {
    return num.toString().padStart(length, '0');
};

// Helper function to format date and time as per SAP requirements
const getSapDateTime = () => {
    const now = new Date();
    const date = `${now.getFullYear()}${formatNumber(now.getMonth() + 1, 2)}${formatNumber(now.getDate(), 2)}`;
    const time = `${formatNumber(now.getHours(), 2)}${formatNumber(now.getMinutes(), 2)}${formatNumber(now.getSeconds(), 2)}`;
    return { date, time };
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const {
            movementType = '201', // Default Movement Type for Goods Issue
            plant,
            order,
            kind,
            gsm,
            width,
            aging = '0',
            binloc,
            idroll,
            weight,
            length
        } = req.body;

        // Validation for required fields
        if (!plant || !idroll || !weight) {
            return res.status(400).json({ message: 'Missing required fields: plant, idroll, and weight are required.' });
        }

        const { date, time } = getSapDateTime();

        // Constructing the EDI content from the request body
        const ediContent = [
            `*RSS*${movementType}`,
            `****${date}*${time}*WIB*`,
            `${plant}*${plant}*${plant}*5*CMI**`,
            `${order || ''}*`,
            `${kind || ''}&${gsm || ''}**MM*`,
            `${width || 0}*0*${aging}*IDR*T**1*1*`,
            `${binloc || ''}*`,
            `${idroll}*${idroll}*U*0*0**1*`,
            `${weight}*${weight}*${weight}*`,
            `${length || 0}*${length || 0}*${length || 0}*`,
            `${date}*${time}`
        ].join('\n'); // CORRECTED: Changed join('') to join('\n')

        const ediFileName = `GI_${idroll}_${date}_${time}.edi`;
        const ediDirectory = path.join(process.cwd(), 'sap_edi', 'goods_issue');

        // Create directories if they don't exist
        if (!fs.existsSync(ediDirectory)) {
            fs.mkdirSync(ediDirectory, { recursive: true });
        }

        const filePath = path.join(ediDirectory, ediFileName);

        fs.writeFileSync(filePath, ediContent);

        res.status(200).json({
            message: 'EDI file for Goods Issue created successfully.',
            filePath: filePath
        });

    } catch (error) {
        console.error('Error generating EDI file:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
