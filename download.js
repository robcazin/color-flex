const Airtable = require('airtable');
const fs = require('fs');
const https = require('https');

const airtable = new Airtable({ apiKey: 'patFtSWH6rXymvmio.c4b5cf40de13b1c3f8468c169a391dd4bfd49bb4d0079220875703ff5affe7c3' });
const base = airtable.base('appsywaKYiyKQTnl3');

async function downloadImage(url, destPath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const file = fs.createWriteStream(destPath);
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
                console.log(`Downloaded to ${destPath}`);
            });
            file.on('error', reject);
        }).on('error', reject);
    });
}

async function downloadAndSaveData() {
    const collections = [
        { name: '1 - ABUNDANCE COLLECTION', enabled: true },
        { name: '3 - ENGLISH COTTAGE', enabled: true },
        { name: '5 - FARMHOUSE', enabled: true },
        { name: '6 - BOTANICALS', enabled: true },
        { name: '7 - DISHED UP', enabled: true },
        { name: '8 - BOMBAY', enabled: true },
        { name: '9 - PAGES', enabled: true },
        { name: '12 - OCEANA', enabled: true },
        { name: '13 - ANCIENT TILES', enabled: true },
        { name: '14 - GEOMETRY', enabled: true },
        { name: '15 - SILK ROAD', enabled: true }
    ];

    const collectionsData = [];

    for (const collection of collections) {
        if (!collection.enabled) continue;
        const tableName = collection.name;
        const baseName = tableName.split(' - ')[1].toLowerCase().replace(/ /g, '_');
        console.log(`Processing ${tableName} (baseName: ${baseName})`);

        const allRecords = await new Promise((resolve, reject) => {
            base(tableName).select({}).all((err, records) => {
                if (err) reject(err);
                else resolve(records);
            });
        });

        const records = await new Promise((resolve, reject) => {
            base(tableName).select({ filterByFormula: "{TRADE SHOW} = 1" }).all((err, records) => {
                if (err) reject(err);
                else resolve(records);
            });
        });

        fs.mkdirSync(`./data/collections/${baseName}/thumbnails`, { recursive: true });
        fs.mkdirSync(`./data/collections/${baseName}/layers`, { recursive: true });
        fs.mkdirSync(`./data/collections/${baseName}/coordinates`, { recursive: true });

        const collectionThumbPath = `./data/collections/${baseName}/${baseName}-thumb.jpg`;
        const placeholderRecord = allRecords.find(r => {
            const number = r.get('NUMBER') || '';
            return number.toLowerCase().endsWith('-000');
        });
        let collectionCuratedColors = [];
        if (placeholderRecord) {
            const thumbAttachments = placeholderRecord.get('THUMBNAIL') || [];
            const thumbUrl = thumbAttachments.length > 0 ? thumbAttachments[0].url : null;
            if (thumbUrl) {
                await downloadImage(thumbUrl, collectionThumbPath);
                console.log(`Collection thumbnail saved for ${baseName} from NUMBER ${placeholderRecord.get('NUMBER')}`);
            } else {
                console.warn(`No THUMBNAIL found for placeholder record in ${tableName}`);
            }
            const curatedColorsRaw = placeholderRecord.get('CURATED COLORS') || "";
            collectionCuratedColors = curatedColorsRaw ? curatedColorsRaw.split(',').map(c => c.trim()) : [];
        } else {
            console.warn(`No record with NUMBER ending in "-000" found in ${tableName}`);
        }

        const jsonRecords = [];
        for (const record of records) {
            const fullName = record.get('name') || `${baseName}-product`;
            const layerAttachments = record.get('LAYER SEPARATIONS') || [];
            const layerPaths = [];
            for (let i = 0; i < layerAttachments.length; i++) {
                const layerUrl = layerAttachments[i].url;
                const attachmentName = layerAttachments[i].filename || `default-layer-${i + 1}.jpg`;
                const parts = attachmentName.split(' - ');
                const patternName = parts.length > 2 ? parts[1].toLowerCase().replace(/ /g, '_') : fullName.toLowerCase().replace(/ /g, '_');
                const layerLabel = parts.length > 3 ? parts[2].toLowerCase().replace(/ /g, '_') : `layer-${i + 1}`;
                console.log(`Pattern name for ${record.id}, layer ${i + 1}: ${patternName}, label: ${layerLabel}`);

                if (layerUrl) {
                    const layerFileName = `${patternName}-${layerLabel}.jpg`;
                    const layerPath = `./data/collections/${baseName}/layers/${layerFileName}`;
                    await downloadImage(layerUrl, layerPath);
                    layerPaths.push(layerPath);
                }
            }

            const coordinateAttachments = record.get('COORDINATES') || [];
            const coordinates = [];
            for (let i = 0; i < coordinateAttachments.length; i++) {
                const coordinateUrl = coordinateAttachments[i].url;
                const attachmentName = coordinateAttachments[i].filename || `default-coordinate-${i + 1}.jpg`;
                const parts = attachmentName.split(' - ');
                const patternName = parts.length > 2 ? parts[1].toLowerCase().replace(/ /g, '_') : fullName.toLowerCase().replace(/ /g, '_');
                const coordinateLabel = parts.length > 3 ? parts[2].toLowerCase().replace(/ /g, '_') : `coordinate-${i + 1}`;
                console.log(`Coordinate name for ${record.id}, coordinate ${i + 1}: ${patternName}, label: ${coordinateLabel}`);

                if (coordinateUrl) {
                    const coordinateFileName = `${patternName}-${coordinateLabel}.jpg`;
                    const coordinatePath = `./data/collections/${baseName}/coordinates/${coordinateFileName}`;
                    await downloadImage(coordinateUrl, coordinatePath);
                    coordinates.push({
                        collection: baseName,
                        pattern: patternName,
                        recommendedscale: record.get('RECOMMENDED SCALE') || 40,
                        filename: coordinateFileName // Add filename here
                    });
                }
            }

            const recordName = layerAttachments.length > 0 ? layerAttachments[0].filename.split(' - ')[1].toLowerCase().replace(/ /g, '_') : fullName.toLowerCase().replace(/ /g, '_');
            console.log(`Checking THUMBNAIL for record ${record.id}:`, record.get('THUMBNAIL'));
            const thumbnailUrl = record.get('THUMBNAIL') ? record.get('THUMBNAIL')[0].url : null;
            const thumbnailPath = thumbnailUrl ? `./data/collections/${baseName}/thumbnails/${recordName}.jpg` : "";
            if (thumbnailUrl) {
                await downloadImage(thumbnailUrl, thumbnailPath);
                console.log(`Pattern thumbnail saved for ${recordName} in ${baseName}`);
            } else {
                console.warn(`No THUMBNAIL found for record ${record.id} in ${tableName}`);
            }

            const layerLabelsRaw = record.get('LAYER LABELS') || "";
            const layerLabels = layerLabelsRaw ? layerLabelsRaw.split(',').map(l => l.trim()) : [];
            const curatedColorsRaw = record.get('CURATED COLORS') || "";
            const curatedColors = curatedColorsRaw ? curatedColorsRaw.split(',').map(c => c.trim()) : [];
            const designerColorsRaw = record.get('DESIGNER COLORS') || "";
            const designerColors = designerColorsRaw ? designerColorsRaw.split(',').map(c => c.trim()) : [];
            const aspect = record.get('ASPECT') || "24x24";
            const repeat = record.get('REPEAT TYPE') || "yes";

            jsonRecords.push({
                id: record.id,
                name: recordName,
                thumbnail: thumbnailPath,
                aspect: aspect,
                repeat: repeat,
                layers: layerPaths.length > 0 ? layerPaths : null,
                layerLabels: layerLabels,
                curatedColors: curatedColors,
                designerColors: designerColors,
                coordinates: coordinates.length > 0 ? coordinates : null,
                updatedAt: new Date().toISOString()
            });
        }

        collectionsData.push({
            name: baseName,
            collection_thumbnail: collectionThumbPath,
            curatedColors: collectionCuratedColors,
            patterns: jsonRecords
        });

        console.log(`Finished processing ${tableName}`);
    }

    console.log('Data processed, creating JSON:', collectionsData);
    const dataStr = JSON.stringify({ collections: collectionsData }, null, 2);
    fs.writeFileSync('./data/local-collections.json', dataStr);
    console.log('local-collections.json written successfully to ./data/');
    console.log('All images downloaded and JSON generated');
}

downloadAndSaveData().catch(console.error);