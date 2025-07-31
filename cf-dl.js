const Airtable = require('airtable');
const fs = require('fs');
const https = require('https');
const sharp = require('sharp');

function extractDimensions(filename) {
    const match = filename.match(/(\d+)\s*X\s*(\d+)/i);
    if (match) {
        const width = parseInt(match[1], 10);
        const height = parseInt(match[2], 10);
        return [width, height];
    }
    return [24, 24];
}

const airtable = new Airtable({ apiKey: 'patFtSWH6rXymvmio.c4b5cf40de13b1c3f8468c169a391dd4bfd49bb4d0079220875703ff5affe7c3' });
const base = airtable.base('appsywaKYiyKQTnl3');

function cleanPatternName(str) {
    return str
        .trim()
        .toLowerCase()
        .replace(/\.\w+$/, '')                           // Remove file extensions
        .replace(/^\d+[a-z]*\s*-\s*/i, '')              // Remove pattern numbers like "110 - "
        .replace(/\s*-\s*\d+x\d+$/i, '')                // Remove dimensions like " - 24X24"
        .replace(/\s*-\s*variant$/i, '')                // Remove -variant suffix
        .replace(/\s*-\s*[a-z\s]+\s+on\s+[a-z\s]+$/i, '') // Remove color descriptions like " - ECRU ON RED PRAIRIE"
        .replace(/\s*-\s*[a-z\s]+\s+and\s+[a-z\s]+$/i, '') // Handle " - COLOR and COLOR" patterns  
        .replace(/\s*-\s*[a-z\s]+\s+over\s+[a-z\s]+$/i, '') // Handle " - COLOR over COLOR" patterns
        .replace(/_/g, ' ')                             // Replace underscores with spaces
        .replace(/\s*-\s*$/, '')                        // Remove trailing " - "
        .split(/[\s-]+/)                                // Split on spaces and hyphens
        .filter(word => word.length > 0)                // Remove empty strings
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Capitalize each word
        .join(" ");                                     // Join with spaces
}

// Parse pattern number components (e.g., "01-01-101A" -> {category: "01", collection: "01", pattern: "101", variant: "A"})
function parsePatternNumber(numberString) {
    if (!numberString || typeof numberString !== 'string') {
        return { category: '', collection: '', pattern: '', variant: '', full: '' };
    }
    
    const match = numberString.match(/^(\d+)-(\d+)-(\d+)([A-Z]?)$/);
    if (match) {
        return {
            category: match[1],
            collection: match[2], 
            pattern: match[3],
            variant: match[4] || '',
            full: numberString
        };
    }
    
    // Fallback for non-standard formats
    return { category: '', collection: '', pattern: '', variant: '', full: numberString };
}

function generateShopifyCSV(collectionsData, baseServerUrl) {
    const csvRows = [];
    
    // ✅ EXACT Shopify Official CSV Headers (2025) - No manual mapping required
    // These headers match Shopify's template exactly to eliminate column mapping
    const headers = [
        'Handle',
        'Title', 
        'Body (HTML)',
        'Vendor',
        'Product Category',
        'Type',
        'Tags',
        'Published',
        'Option1 Name',
        'Option1 Value',
        'Variant SKU',
        'Variant Price',
        'Variant Compare At Price',
        'Variant Requires Shipping',
        'Variant Taxable',
        'Variant Barcode',
        'Variant Inventory Tracker',
        'Variant Inventory Policy',
        'Variant Inventory Qty',
        'Image Src',
        'Image Position',
        'Image Alt Text',
        'SEO Title',
        'SEO Description',
        'Metafields: color_flex.base_url [url]',
        'Metafields: color_flex.collection [single_line_text_field]',
        'Metafields: color_flex.pattern [single_line_text_field]',
        'Metafields: color_flex.layer_count [number_integer]',
        'Metafields: color_flex.layer_labels [single_line_text_field]',
        'Metafields: color_flex.pattern_size [single_line_text_field]',
        'Metafields: color_flex.tiling_type [single_line_text_field]',
        'Metafields: color_flex.designer_colors [single_line_text_field]',
        'Metafields: color_flex.pattern_number [single_line_text_field]',
        'Metafields: color_flex.collection_sequence [single_line_text_field]',
        'Metafields: color_flex.pattern_sequence [single_line_text_field]',
        'Metafields: color_flex.pattern_variant [single_line_text_field]'
    ];
    
    csvRows.push(headers);
    
    collectionsData.collections.forEach(collection => {
        // Process ALL patterns, but distinguish between ColorFlex and Standard
        const allPatterns = collection.patterns;
        const colorFlexCount = allPatterns.filter(p => p.colorFlex === true).length;
        const standardCount = allPatterns.length - colorFlexCount;
        
        console.log(`[CSV] Collection ${collection.name}: ${colorFlexCount} ColorFlex + ${standardCount} Standard = ${allPatterns.length} total patterns`);
        
        allPatterns.forEach(pattern => {
            const handle = `${collection.name}-${pattern.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            const patternFileName = pattern.name.toLowerCase().replace(/\s+/g, '-');
            
            // Parse pattern number components
            const numberData = parsePatternNumber(pattern.number);
            
            // Construct server URLs
            const thumbnailUrl = `${baseServerUrl}/data/collections/${collection.name}/thumbnails/${patternFileName}.jpg`;
            
            // Determine product type based on ColorFlex flag
            const isColorFlex = pattern.colorFlex === true;
            const productType = isColorFlex ? 'ColorFlex Pattern' : 'Standard Pattern';
            const productCategory = 'Home & Garden > Decor';
            
            // Different tags based on pattern type
            // Include collection name as first tag for smart collection filtering
            const baseTags = `${collection.name}, pattern, wallpaper, fabric`;
            const tags = isColorFlex 
                ? `${baseTags}, removable, custom-color, colorflex`
                : `${baseTags}, standard`;
            
            // Generate SEO-optimized content
            const seoTitle = `${pattern.name} - ${collection.name.charAt(0).toUpperCase() + collection.name.slice(1)} Collection | ColorFlex Wallpaper`;
            const seoDescription = `${pattern.name} pattern from our ${collection.name.charAt(0).toUpperCase() + collection.name.slice(1)} collection. ${isColorFlex ? 'Customize colors to match your space perfectly with our ColorFlex system.' : 'Classic design available in standard colorways.'} Available for wallpaper, fabric, and other applications.`;
            
            const row = [
                handle, // Handle
                pattern.name, // Title
                `<p>${pattern.name} pattern from our ${collection.name.charAt(0).toUpperCase() + collection.name.slice(1)} collection. ${numberData.full ? `Pattern #${numberData.full}. ` : ''}${isColorFlex ? 'Customize colors to match your space perfectly with our ColorFlex system.' : 'Classic design available in standard colorways.'} Available for wallpaper, fabric, and other applications.</p>`, // Body HTML
                'Saffron Cottage', // Vendor
                productCategory, // Product Category
                productType, // Type
                tags, // Tags
                'TRUE', // Published
                'Application', // Option1 Name
                'Pattern', // Option1 Value
                numberData.full || handle, // Variant SKU
                '89.99', // Variant Price
                '', // Variant Compare At Price
                'TRUE', // Variant Requires Shipping
                'TRUE', // Variant Taxable
                '', // Variant Barcode
                '', // Variant Inventory Tracker (empty = no inventory tracking)
                'continue', // Variant Inventory Policy (continue selling when out of stock)
                '', // Variant Inventory Qty (empty = no inventory tracking)
                thumbnailUrl, // Image Src
                '1', // Image Position
                `${pattern.name} pattern thumbnail`, // Image Alt Text
                seoTitle, // SEO Title
                seoDescription, // SEO Description
                baseServerUrl + '/data/collections/', // Metafield: base_url
                collection.name, // Metafield: collection
                patternFileName, // Metafield: pattern
                pattern.layers.length.toString(), // Metafield: layer_count
                pattern.layerLabels.join(','), // Metafield: layer_labels
                `${pattern.size[0]}x${pattern.size[1]}`, // Metafield: pattern_size
                pattern.tilingType || 'straight', // Metafield: tiling_type
                pattern.designer_colors.join(','), // Metafield: designer_colors
                numberData.full, // Metafield: pattern_number (e.g., "01-01-101A")
                numberData.collection, // Metafield: collection_sequence (e.g., "01")
                numberData.pattern, // Metafield: pattern_sequence (e.g., "101")
                numberData.variant // Metafield: pattern_variant (e.g., "A")
            ];
            
            csvRows.push(row);
        });
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => 
        row.map(field => `"${String(field || '').replace(/"/g, '""')}"`)
           .join(',')
    ).join('\n');
    
    return csvContent;
}

// Generate a blank Shopify CSV template for reference (eliminates column mapping)
function generateShopifyTemplate() {
    const headers = [
        'Handle',
        'Title', 
        'Body (HTML)',
        'Vendor',
        'Product Category',
        'Type',
        'Tags',
        'Published',
        'Option1 Name',
        'Option1 Value',
        'Variant SKU',
        'Variant Price',
        'Variant Compare At Price',
        'Variant Requires Shipping',
        'Variant Taxable',
        'Variant Barcode',
        'Variant Inventory Tracker',
        'Variant Inventory Policy',
        'Variant Inventory Qty',
        'Image Src',
        'Image Position',
        'Image Alt Text',
        'SEO Title',
        'SEO Description',
        'Metafields: color_flex.base_url [url]',
        'Metafields: color_flex.collection [single_line_text_field]',
        'Metafields: color_flex.pattern [single_line_text_field]',
        'Metafields: color_flex.layer_count [number_integer]',
        'Metafields: color_flex.layer_labels [single_line_text_field]',
        'Metafields: color_flex.pattern_size [single_line_text_field]',
        'Metafields: color_flex.tiling_type [single_line_text_field]',
        'Metafields: color_flex.designer_colors [single_line_text_field]',
        'Metafields: color_flex.pattern_number [single_line_text_field]',
        'Metafields: color_flex.collection_sequence [single_line_text_field]',
        'Metafields: color_flex.pattern_sequence [single_line_text_field]',
        'Metafields: color_flex.pattern_variant [single_line_text_field]'
    ];
    
    // Add example row showing data format
    const exampleRow = [
        'example-pattern-handle',
        'Example Pattern Name',
        '<p>Example pattern description with HTML formatting.</p>',
        'Saffron Cottage',
        'Home & Garden > Decor',
        'ColorFlex Pattern',
        'collection-name, pattern, wallpaper, fabric, removable, custom-color, colorflex',
        'TRUE',
        'Application',
        'Pattern',
        '01-01-101A',
        '89.99',
        '',
        'TRUE',
        'TRUE',
        '',
        '',
        'continue',
        '',
        'https://example.com/image.jpg',
        '1',
        'Pattern thumbnail alt text',
        'Pattern Name - Collection | ColorFlex Wallpaper',
        'SEO description for pattern...',
        'https://example.com/data/collections/',
        'collection-name',
        'pattern-file-name',
        '2',
        'Layer 1,Layer 2',
        '24x24',
        'straight',
        'Color1,Color2',
        '01-01-101A',
        '01',
        '101',
        'A'
    ];
    
    const csvContent = [headers, exampleRow]
        .map(row => row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    
    return csvContent;
}


async function downloadImage(url, destPath, maxDimension = 2800, retries = 3, forceDownload = false) {
    // Check if file already exists (for incremental updates) - skip if force download is enabled
    if (!forceDownload && fs.existsSync(destPath)) {
        try {
            const metadata = await sharp(destPath).metadata();
            console.log(`[SKIP] File exists: ${destPath} (${metadata.width}x${metadata.height})`);
            return metadata;
        } catch (err) {
            console.log(`[EXISTING ERROR] Corrupted file detected, re-downloading: ${destPath}`);
            // Continue with download if existing file is corrupted
        }
    }
    
    console.log(`[DOWNLOAD] Starting download: ${url} -> ${destPath}`);
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await new Promise((resolve, reject) => {
                https.get(url, { timeout: 30000 }, (response) => {
                    const file = fs.createWriteStream(destPath);
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                    file.on('error', (err) => {
                        fs.unlink(destPath, () => {});
                        reject(err);
                    });
                }).on('error', (err) => reject(err));
            });

            const metadata = await sharp(destPath).metadata();
            console.log(`[DOWNLOAD SUCCESS] Downloaded ${destPath}: ${metadata.width}x${metadata.height}`);
            if (maxDimension && (metadata.width > maxDimension || metadata.height > maxDimension)) {
                const aspectRatio = metadata.width / metadata.height;
                const [targetWidth, targetHeight] = metadata.width > metadata.height
                    ? [maxDimension, Math.round(maxDimension / aspectRatio)]
                    : [Math.round(maxDimension * aspectRatio), maxDimension];
                const tempPath = `${destPath}.tmp`;
                await sharp(destPath)
                    .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 90 })
                    .toFile(tempPath);
                fs.renameSync(tempPath, destPath);
                console.log(`[RESIZE] Resized to ${targetWidth}x${targetHeight}`);
            }
            return metadata;
        } catch (err) {
            console.error(`[DOWNLOAD ERROR] Attempt ${attempt} failed for ${destPath}: ${err.message}`);
            if (attempt === retries) throw err;
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
    }
}

function parseFileName(filename, layerIndex, patternNameOverride = null) {
    const withoutExtension = filename.replace(/\.jpg$/i, '');
    const parts = withoutExtension.split(" - ").filter(Boolean);

    console.log(`Parsing filename: ${filename}, patternNameOverride: ${patternNameOverride}`);
    console.log(`Parts: ${parts}`);

    // Use patternNameOverride if provided, otherwise fall back to the second part
    const patternName = patternNameOverride || (parts.length > 1 ? cleanPatternName(parts[1]) : `Pattern${layerIndex + 1}`);
    console.log(`Pattern name: ${patternName}`);

    // Layer label is the third part (index 2)
    const layerLabelRaw = parts.length > 2 ? parts[2] : `Unnamed Layer`;
    let layerLabel = layerLabelRaw
        .split(/[\s-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();

    // Special case for shadows
    if (layerLabelRaw.toUpperCase().includes("ISSHADOW") || layerLabelRaw.toUpperCase().includes("SHADOW")) {
        layerLabel = "Shadows";
        console.log(`Applied shadow special case: ${layerLabel}`);
    }

    // Construct filename with pattern name and raw layer label
    const normalizedFileName = [
        patternName.toLowerCase().replace(/\s+/g, '-'),
        layerLabelRaw.toLowerCase().replace(/\s+/g, '-'),
        `layer-${layerIndex + 1}`
    ].filter(Boolean).join('_').replace(/_+/g, '_');

    console.log(`Result: Pattern: ${patternName}, Label: ${layerLabel}, File: ${normalizedFileName}`);
    return { patternName, layerFileName: normalizedFileName, layerLabel };
}

function parseMockupDimensions(filename) {
    const match = filename.match(/W(\d+)H(\d+)/i);
    return match ? { widthInches: parseInt(match[1]), heightInches: parseInt(match[2]) } : { widthInches: 60, heightInches: 45 };
}

function cleanLayerFilename(filename, coordinateName, index) {
    // Clean the coordinate name (e.g., "TRESSELWOOD" -> "tresselwood")
    const cleanCoordName = coordinateName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    // Extract the layer label from the filename (e.g., "BACK" or "FRONT")
    const parts = filename.toLowerCase().split(' - ');
    const label = parts.length > 1 ? parts[1].replace(/[^a-z0-9]/g, '') : `layer${index + 1}`;

    // Construct the cleaned filename
    return `${cleanCoordName}_${label}_layer-${index + 1}.jpg`;
}

async function fetchCollectionData(collectionName = null) {
    
// All collections - ACTIVE field on master record (ending in -000) controls inclusion
const collections = [
    { name: '1 - ABUNDANCE' },
    { name: '2 - COVERLETS' },
    { name: '3 - ENGLISH COTTAGE' },
    { name: '4 - TRADITIONS' },
    { name: '5 - FARMHOUSE' },
    { name: '6 - BOTANICALS' },
    { name: '8 - BOMBAY' },
    { name: '14 - GEOMETRY' },
    { name: '15 - SILK ROAD' },
    { name: '16 - WALL PANELS' },
    { name: '17 - NEW ORLEANS' },
    { name: '18 - FOLKSIE' },
    { name: '21 - COORDINATES' } // Background data only - not displayed as products
];
    // Read existing collections.json
    let existingData = { collections: [] };
    try {
        if (fs.existsSync('./data/collections.json')) {
            const fileContent = fs.readFileSync('./data/collections.json', 'utf8');
            existingData = JSON.parse(fileContent);
            console.log("Loaded existing collections.json:", existingData.collections.map(c => c.name));
        }
    } catch (error) {
        console.error("Error reading collections.json, starting with empty data:", error);
    }

    // Filter collections if collectionName is specified
    let targetCollections = collections;
    if (collectionName) {
        targetCollections = collections.filter(c => c.name.toLowerCase().includes(collectionName.toLowerCase()));
        if (!targetCollections.length) {
            console.error(`No collection found matching: ${collectionName}`);
            return existingData;
        }
        console.log(`Processing single collection: ${collectionName}`);
        console.log(`Matched collections:`, targetCollections.map(c => c.name));
    }

    console.log("Starting fetchCollectionData...");
    console.log("Input collections:", targetCollections);

    if (!targetCollections || targetCollections.length === 0) {
        console.error("No collections to process");
        return existingData;
    }

    // Fetch coordinates from 21 - COORDINATES table
    // NOTE: Coordinates are not displayed as products to customers, only used for matching function in app
    let coordinateRecords = [];
    try {
        coordinateRecords = await base('21 - COORDINATES').select({ filterByFormula: "{ACTIVE} = 1" }).all();
        console.log(`Fetched ${coordinateRecords.length} ACTIVE coordinate records from 21 - COORDINATES (background data only)`);
    } catch (error) {
        console.error("Error fetching coordinate records:", error);
    }

    const coordinateData = coordinateRecords.map(record => {
        const rawName = record.get('NAME') || '';
        const filename = rawName
            .toLowerCase()
            .replace(/[^a-z0-9\s-.]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/\.jpg$/i, '')
            || '';
        const thumbnailUrl = record.get('THUMBNAIL')?.[0]?.url || '';
        const layerAttachments = record.get('LAYER SEPARATIONS') || [];
    
        // Process all layers in LAYER SEPARATIONS
        const layerPaths = layerAttachments.map((attachment, index) => {
            const layerFilename = cleanLayerFilename(attachment.filename || `${filename}_layer-${index + 1}.jpg`, filename, index);
            return `./data/collections/coordinates/layers/${layerFilename}`;
        });
    
        console.log(`Coordinate record: rawName="${rawName}", cleaned="${filename}", layers=`, layerPaths);
    
        return {
            filename,
            thumbnailPath: thumbnailUrl ? `./data/collections/coordinates/thumbnails/${filename}.jpg` : null,
            layerPaths: layerPaths.length > 0 ? layerPaths : null // Array of layer paths
        };
    }).filter(coord => coord.thumbnailPath && coord.layerPaths && coord.layerPaths.length > 0);
    
    console.log("Processed coordinate data:", coordinateData);

    for (const collection of targetCollections) {
        console.log(`\n[COLLECTION CHECK] Processing ${collection.name}`);
        
        const tableName = collection.name;
        const baseName = tableName.split(' - ')[1]?.toLowerCase().replace(/\s+/g, '-') || tableName.toLowerCase().replace(/\s+/g, '-');
        console.log(`[START] Processing ${tableName} (baseName: ${baseName})`);

        try {
            // First, fetch all records to find the placeholder
            console.log(`[FETCH] Getting all records from ${tableName}...`);
            const allRecords = await base(tableName).select({}).all();
            console.log(`[FETCH] Found ${allRecords.length} total records in ${tableName}`);
            
            // Find placeholder record
            const placeholderRecord = allRecords.find(r => (r.get('NUMBER') || '').toLowerCase().endsWith('-000'));
            
            if (!placeholderRecord) {
                console.warn(`[SKIP] No placeholder record (-000) found for ${baseName}`);
                continue;
            }

            console.log(`[PLACEHOLDER] Found placeholder record: ${placeholderRecord.get('NUMBER')}`);

            // Check ACTIVE field on the master record (controls Shopify inclusion)
            const isActive = placeholderRecord.get('ACTIVE');
            console.log(`[ACTIVE] Field value for ${baseName}: ${isActive} (type: ${typeof isActive})`);
            
            if (!isActive) {
                console.log(`[SKIP] ACTIVE is not enabled for ${baseName} - enable it on the master record (${placeholderRecord.get('NUMBER')})`);
                continue;
            }

            console.log(`[PROCEED] ACTIVE is enabled for ${baseName}, proceeding...`);

            // Now get ACTIVE records (Color-Flex field is now just metadata)
            console.log(`[FETCH] Getting ACTIVE records for ${tableName}...`);
            const records = await base(tableName).select({ filterByFormula: "{ACTIVE} = 1" }).all();
            console.log(`[FETCH] Found ${records.length} ACTIVE records for ${tableName}`);
            
            // Debug: Show all records and their ACTIVE/Color-Flex status
            console.log(`[DEBUG ALL RECORDS] Checking ACTIVE/Color-Flex status for all records in ${tableName}:`);
            for (const record of allRecords) {
                const number = record.get('NUMBER') || 'no-number';
                const name = record.get('NAME') || 'no-name';
                const isActive = record.get('ACTIVE');
                const colorFlex = record.get('Color-Flex');
                const hasLayers = (record.get('LAYER SEPARATIONS') || []).length > 0;
                console.log(`  - ${number}: ${name.substring(0, 30)}... | ACTIVE: ${isActive} | Color-Flex: ${colorFlex} | Has Layers: ${hasLayers}`);
            }

            if (records.length === 0) {
                console.warn(`[SKIP] No ACTIVE records found for ${tableName}`);
                continue;
            }

            const collectionThumbPath = `./data/collections/${baseName}/${baseName}-thumb.jpg`;
            let collectionCuratedColors = [];
            let collectionCoordinates = [];
            let mockupName = "./data/mockups/English-Countryside-Bedroom-1-W60H45.png";
            let mockupShadowName = null;
            let mockupDims = { widthInches: 60, heightInches: 45 };

            const thumbAttachments = placeholderRecord.get('THUMBNAIL') || [];
            collectionCuratedColors = (placeholderRecord.get('CURATED COLORS') || "")
                .split(/[,|.]/)
                .map(c => c.trim())
                .filter(Boolean);

            // Map COORDINATES field to 21 - COORDINATES
            const coordField = placeholderRecord.get('COORDINATES') || [];
            console.log(`[COORDINATES] Field for ${baseName}:`, coordField);
            collectionCoordinates = coordField.map(coord => {
                const rawFilename = coord.filename || '';
                let cleanFilename = rawFilename
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-.]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/\.jpg$/i, '');
                const coordRecord = coordinateData.find(c => c.filename === cleanFilename);
                if (coordRecord) {
                    return {
                        collection: 'coordinates',
                        filename: coordRecord.filename + '.jpg',
                        path: coordRecord.thumbnailPath,
                        layerPaths: coordRecord.layerPaths
                    };
                }
                console.warn(`No matching coordinate record for ${rawFilename} (cleaned: ${cleanFilename})`);
                return null;
            }).filter(Boolean);

            console.log(`[COLLECTION DATA] Curated colors for ${baseName}:`, collectionCuratedColors);
            console.log(`[COLLECTION DATA] Coordinates for ${baseName}:`, collectionCoordinates);

            const mockupField = placeholderRecord.get('MOCKUP');
            if (mockupField) {
                const mockupValues = mockupField.split(',').map(v => v.trim());
                mockupName = `./data/mockups/${mockupValues[0]}.png`;
                if (mockupValues.length > 1) mockupShadowName = `./data/mockups/${mockupValues[1]}.jpg`;
            }
            mockupDims = parseMockupDimensions(mockupName.split('/').pop());

            const coordinateIds = new Set();
            for (const record of records) {
                const coordField = record.get('COORDINATES');
                if (coordField && Array.isArray(coordField)) {
                    coordField.forEach(coord => coordinateIds.add(coord.id));
                }
            }

            const patternMap = new Map();
            for (const record of records) {
                const number = record.get('NUMBER') || '';
                
                // Skip the master record (-000) - it's only for collection metadata
                if (number.toLowerCase().endsWith('-000')) {
                    console.log(`[SKIP PATTERN] ${number} (master record - collection metadata only)`);
                    continue;
                }
                
                
                if (coordinateIds.has(record.id)) {
                    console.log(`[SKIP PATTERN] ${record.id} (coordinate)`);
                    continue;
                }

                const rawName = record.get('NAME') || `${baseName}-product`;
                const nameParts = rawName.split(/\s*-\s*/);
                let parsedPatternName = nameParts.length > 1 ? cleanPatternName(nameParts[1]) : cleanPatternName(rawName);

                const layerAttachments = record.get('LAYER SEPARATIONS') || [];
                if (parsedPatternName === baseName && layerAttachments.length > 0) {
                    const firstLayerParts = layerAttachments[0].filename.split(" - ");
                    if (firstLayerParts.length > 1 && firstLayerParts[0].match(/^\d+[-A-Za-z]*$/)) {
                        parsedPatternName = cleanPatternName(firstLayerParts[1]);
                    }
                }

                const existing = patternMap.get(parsedPatternName);
                if (!existing || layerAttachments.length > existing.layerCount) {
                    patternMap.set(parsedPatternName, { record, layerCount: layerAttachments.length });
                }
            }

            console.log(`[PATTERNS] Found ${patternMap.size} patterns for ${tableName}`);

            if (patternMap.size === 0) {
                console.warn(`[SKIP] No valid patterns found for ${tableName}`);
                continue;
            }

            let jsonRecords = [];
            for (const [parsedPatternName, { record }] of patternMap) {
                const recordId = record.id;
                const number = record.get('NUMBER') || '';
                const fileSafeName = parsedPatternName.toLowerCase().replace(/\s+/g, '-');
                const thumbnailPath = `./data/collections/${baseName}/thumbnails/${fileSafeName}.jpg`;
                const tilingStyle = (record.get('THUMBNAIL') || [])[0]?.filename.toUpperCase().includes("HD") ? "half-drop" : "straight";

                const tintWhite = record.get('tintWhite') === true;
                const layerAttachments = tintWhite ? [] : (record.get('LAYER SEPARATIONS') || []);
                console.log(`[DEBUG LAYERS] Pattern ${parsedPatternName}:`);
                console.log(`  - tintWhite: ${tintWhite}`);
                console.log(`  - LAYER SEPARATIONS field:`, record.get('LAYER SEPARATIONS'));
                console.log(`  - layerAttachments.length: ${layerAttachments.length}`);
                if (layerAttachments.length > 0) {
                    console.log(`  - First layer filename: ${layerAttachments[0].filename}`);
                    console.log(`  - First layer URL: ${layerAttachments[0].url}`);
                }
                
                let baseCompositePath = null;
                if (tintWhite && record.get('BASE COMPOSITE')?.[0]) {
                    const baseCompositeFilename = record.get('BASE COMPOSITE')[0].filename || `${fileSafeName}-base.jpg`;
                    const parsedBaseComposite = parseFileName(baseCompositeFilename, 0, parsedPatternName);
                    baseCompositePath = `./data/collections/${baseName}/layers/${parsedBaseComposite.layerFileName}.jpg`;
                }

                const layerData = [];
                const layerLabels = [];
                for (let i = 0; i < layerAttachments.length; i++) {
                    const layerFilename = layerAttachments[i].filename || `${fileSafeName}-layer-${i + 1}.jpg`;
                    const parsedLayer = parseFileName(layerFilename, i, parsedPatternName);
                    const layerPath = `./data/collections/${baseName}/layers/${parsedLayer.layerFileName}.jpg`;
                    layerData.push({ path: layerPath });
                    layerLabels.push(parsedLayer.layerLabel);
                }

                // Get designer colors, fallback to collection curated colors if empty
                let designerColors = (record.get('DESIGNER COLORS') || "")
                    .split(/[,|.]/)
                    .map(c => c.trim())
                    .filter(Boolean);
                
                // If no designer colors, use collection's curated colors as fallback
                if (designerColors.length === 0) {
                    designerColors = collectionCuratedColors;
                    console.log(`[FALLBACK COLORS] Pattern ${parsedPatternName}: Using collection curated colors (${designerColors.length} colors)`);
                } else {
                    console.log(`[DESIGNER COLORS] Pattern ${parsedPatternName}: Using pattern-specific colors (${designerColors.length} colors)`);
                }

                const thumbnailAttachment = (record.get('THUMBNAIL') || [])[0];
                const thumbnailFilename = thumbnailAttachment?.filename || '';
                const size = extractDimensions(thumbnailFilename);
                console.log(`[PATTERN] ${parsedPatternName}: size=${size}, layers=${layerData.length}`);

                jsonRecords.push({
                    id: recordId,
                    number: number,
                    name: parsedPatternName,
                    thumbnail: thumbnailPath,
                    size: size,                     
                    repeat: record.get('REPEAT TYPE') || "yes",
                    layers: layerData,
                    layerLabels: layerLabels,
                    tilingType: tilingStyle,
                    designer_colors: designerColors,
                    colorFlex: record.get('Color-Flex') === true, // Add ColorFlex flag
                    coordinates: collectionCoordinates.length > 0 ? collectionCoordinates : null,
                    baseComposite: baseCompositePath,
                    tintWhite: tintWhite,
                    updatedAt: new Date().toISOString()
                });
            }

            const newCollectionData = {
                name: baseName,
                tableName: tableName,
                collection_thumbnail: collectionThumbPath,
                curatedColors: collectionCuratedColors,
                coordinates: collectionCoordinates.length > 0 ? collectionCoordinates : null,
                mockup: mockupName,
                mockupShadow: mockupShadowName,
                mockupWidthInches: mockupDims.widthInches,
                mockupHeightInches: mockupDims.heightInches,
                patterns: jsonRecords
            };

            // Merge with existing data
            const existingIndex = existingData.collections.findIndex(c => c.name === baseName);
            if (existingIndex !== -1) {
                existingData.collections[existingIndex] = newCollectionData;
                console.log(`[UPDATE] Updated existing collection ${baseName} in collections.json`);
            } else {
                existingData.collections.push(newCollectionData);
                console.log(`[ADD] Added new collection ${baseName} to collections.json`);
            }
        } catch (error) {
            console.error(`[ERROR] Processing ${tableName}:`, error);
        }
    }

    console.log(`\n[COMPLETE] fetchCollectionData completed, collections: ${existingData.collections.length}`);
    return existingData;
}

async function downloadImagesForCollections(data, collectionName = null, forceDownload = false) {
    console.log(`\n[DOWNLOAD START] Starting downloadImagesForCollections with collectionName=${collectionName}, forceDownload=${forceDownload}`);
    console.log(`[DOWNLOAD START] Collections available:`, data.collections.map(c => c.name));
    
    let targetCollections = data.collections;
    if (collectionName && collectionName !== 'null') {
        targetCollections = data.collections.filter(c => c.name.toLowerCase().includes(collectionName.toLowerCase()));
        if (!targetCollections.length) {
            console.error(`[DOWNLOAD ERROR] No collection found matching: ${collectionName}`);
            return;
        }
        console.log(`[DOWNLOAD] Downloading images for single collection: ${collectionName}`);
    } else {
        console.log(`[DOWNLOAD] Processing all collections for image downloads`);
    }

    console.log(`[DOWNLOAD] Target collections:`, targetCollections.map(c => c.name));

    for (const collection of targetCollections) {
        const baseName = collection.name;
        console.log(`\n[DOWNLOAD COLLECTION] Starting ${baseName}`);

        // Create directories
        const dirs = [
            `./data/collections/${baseName}/thumbnails`,
            `./data/collections/${baseName}/layers`,
            `./data/collections/${baseName}/coordinates`,
            `./data/collections/coordinates/thumbnails`,
            `./data/collections/coordinates/layers`
        ];
        
        for (const dir of dirs) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[MKDIR] Created directory: ${dir}`);
        }

        // Download collection thumbnail
        const placeholderRecord = (await base(collection.tableName).select({}).all()).find(r => (r.get('NUMBER') || '').toLowerCase().endsWith('-000'));
        if (placeholderRecord && placeholderRecord.get('THUMBNAIL')?.[0]?.url) {
            console.log(`[DOWNLOAD COLLECTION THUMB] Downloading collection thumbnail for ${baseName}`);
            try {
                await downloadImage(placeholderRecord.get('THUMBNAIL')[0].url, collection.collection_thumbnail, 2800, 3, forceDownload);
            } catch (error) {
                console.error(`[DOWNLOAD ERROR] Failed to download collection thumbnail for ${baseName}:`, error);
            }
        } else {
            console.warn(`[DOWNLOAD WARN] No collection thumbnail URL for ${baseName}`);
        }

        // Download pattern images
        console.log(`[DOWNLOAD PATTERNS] Processing ${collection.patterns.length} patterns for ${baseName}`);
        for (const pattern of collection.patterns) {
            console.log(`\n[DOWNLOAD PATTERN] Processing pattern: ${pattern.name}`);
            
            try {
                const patternRecord = await base(collection.tableName).find(pattern.id);
                const thumbnailUrl = patternRecord.get('THUMBNAIL')?.[0]?.url;
                
                if (thumbnailUrl) {
                    console.log(`[DOWNLOAD THUMB] Downloading thumbnail for ${pattern.name}`);
                    const metadata = await downloadImage(thumbnailUrl, pattern.thumbnail, 2800, 3, forceDownload);
                    if (metadata) {
                        const pixelAspect = metadata.width / metadata.height;
                        pattern.size[1] = Math.round(pattern.size[0] / pixelAspect);
                    }
                } else {
                    console.warn(`[DOWNLOAD WARN] No THUMBNAIL URL for ${pattern.name}`);
                }

                if (pattern.baseComposite) {
                    const baseCompositeUrl = patternRecord.get('BASE COMPOSITE')?.[0]?.url;
                    if (baseCompositeUrl) {
                        console.log(`[DOWNLOAD BASE] Downloading base composite for ${pattern.name}`);
                        await downloadImage(baseCompositeUrl, pattern.baseComposite, 2800, 3, forceDownload);
                    }
                }

                for (let i = 0; i < pattern.layers.length; i++) {
                    const layerUrl = patternRecord.get('LAYER SEPARATIONS')?.[i]?.url;
                    if (layerUrl) {
                        console.log(`[DOWNLOAD LAYER] Downloading layer ${pattern.layerLabels[i]} for ${pattern.name} (URL: ${layerUrl})`);
                        const metadata = await downloadImage(layerUrl, pattern.layers[i].path, 1400, 3, forceDownload);
                        if (i === 0 && !pattern.tintWhite && !pattern.baseComposite && metadata) {
                            const pixelAspect = metadata.width / metadata.height;
                            pattern.size[1] = Math.round(pattern.size[0] / pixelAspect);
                        }
                    } else {
                        console.warn(`[DOWNLOAD WARN] No layer URL for ${pattern.name} layer ${i} - LAYER SEPARATIONS field may be empty`);
                        console.log(`[DEBUG] LAYER SEPARATIONS field content:`, patternRecord.get('LAYER SEPARATIONS'));
                    }
                }
            } catch (error) {
                console.error(`[DOWNLOAD ERROR] Failed to process pattern ${pattern.name}:`, error);
            }
        }

        // Download coordinate images
        if (collection.coordinates) {
            console.log(`[DOWNLOAD COORDINATES] Processing ${collection.coordinates.length} coordinates for ${baseName}`);
            const coordRecords = await base('21 - COORDINATES').select({}).all();
            
            for (const coord of collection.coordinates) {
                console.log(`[DOWNLOAD COORD] Processing coordinate: ${coord.filename}`);
                const cleanFilename = coord.filename
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-.]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/\.jpg$/i, '');
                    
                const coordRecord = coordRecords.find(r => {
                    const recordName = r.get('NAME')?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') || '';
                    return recordName === cleanFilename;
                });
                
                if (coordRecord) {
                    const thumbnailUrl = coordRecord.get('THUMBNAIL')?.[0]?.url;
                    const layerUrls = coordRecord.get('LAYER SEPARATIONS')?.map(attachment => attachment.url) || [];
                    
                    if (thumbnailUrl) {
                        console.log(`[DOWNLOAD COORD THUMB] Downloading coordinate thumbnail ${coord.filename}`);
                        try {
                            await downloadImage(thumbnailUrl, coord.path, 2800, 3, forceDownload);
                        } catch (error) {
                            console.error(`[DOWNLOAD ERROR] Failed to download thumbnail for ${coord.filename}:`, error);
                        }
                    }
                    
                    for (let i = 0; i < layerUrls.length; i++) {
                        const layerPath = coord.layerPaths[i];
                        console.log(`[DOWNLOAD COORD LAYER] Downloading coordinate layer ${i + 1} for ${coord.filename}`);
                        try {
                            await downloadImage(layerUrls[i], layerPath, 2800, 3, forceDownload);
                        } catch (error) {
                            console.error(`[DOWNLOAD ERROR] Failed to download layer ${i + 1} for ${coord.filename}:`, error);
                        }
                    }
                } else {
                    console.warn(`[DOWNLOAD WARN] No coordinate record found for ${coord.filename} (cleaned: ${cleanFilename})`);
                }
            }
        }
        
        console.log(`[DOWNLOAD COMPLETE] Finished downloading for collection: ${baseName}`);
    }
    
    console.log(`\n[DOWNLOAD ALL COMPLETE] All downloads finished`);
}

async function main(downloadImages = false, collectionName = null, generateShopify = false, forceDownload = false) {
    console.log(`\n=== STARTING MAIN ===`);
    console.log(`[MAIN] Running with downloadImages=${downloadImages}, collectionName=${collectionName}, generateShopify=${generateShopify}, forceDownload=${forceDownload}`);
    
    const data = await fetchCollectionData(collectionName);
    console.log(`[MAIN] Fetched collection data:`, data.collections.map(c => c.name));

    // Write updated data to collections.json
    try {
        fs.writeFileSync('./data/collections.json', JSON.stringify(data, null, 2));
        console.log(`[MAIN] Successfully wrote to collections.json`);
    } catch (error) {
        console.error(`[MAIN ERROR] Error writing to collections.json:`, error);
    }

    // Generate Shopify CSV if requested
    if (generateShopify) {
        try {
            const baseServerUrl = 'https://so-animation.com/colorflex'; // Your actual server URL
            const csvContent = generateShopifyCSV(data, baseServerUrl);
            fs.writeFileSync('./data/shopify-import.csv', csvContent);
            console.log(`[MAIN] ✅ Successfully generated shopify-import.csv with EXACT Shopify headers (no manual mapping required!)`);
            
            // Also generate template file for reference
            const templateContent = generateShopifyTemplate();
            fs.writeFileSync('./data/shopify-template.csv', templateContent);
            console.log(`[MAIN] ✅ Generated shopify-template.csv for future reference`);
        } catch (error) {
            console.error(`[MAIN ERROR] Error generating Shopify CSV:`, error);
        }
    }

    // Download images if specified
    if (downloadImages) {
        console.log(`[MAIN] Starting image downloads...`);
        await downloadImagesForCollections(data, collectionName, forceDownload);
        console.log(`[MAIN] Image downloads completed`);
    } else {
        console.log(`[MAIN] Skipping image downloads (downloadImages=${downloadImages})`);
    }

    console.log(`[MAIN] Main execution completed`);
    console.log(`=== MAIN COMPLETE ===\n`);
}

// Update the command line arguments parsing
const args = process.argv.slice(2);
const downloadImages = args[0] === 'true';
const collectionName = args[1] || null;
const generateShopify = args[2] === 'shopify';
const forceDownload = args[3] === 'force' || args[2] === 'force';

console.log(`\n=== SCRIPT START ===`);
console.log(`Arguments: downloadImages=${downloadImages}, collectionName=${collectionName}, generateShopify=${generateShopify}, forceDownload=${forceDownload}`);

// Export functions for use in other modules
module.exports = {
    fetchCollectionData,
    downloadImagesForCollections,
    generateShopifyCSV,
    generateShopifyTemplate,
    main
};

// Only run main if this file is executed directly
if (require.main === module) {
    main(downloadImages, collectionName, generateShopify, forceDownload).catch(err => console.error("Main error:", err));
}