import geojsonvt from '../src/index.js';

// Example demonstrating incremental updates to a GeoJSON vector tile index

// Create initial dataset
const initialData = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 'building-1',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-74.0059, 40.7128],
                    [-74.0049, 40.7128], 
                    [-74.0049, 40.7138],
                    [-74.0059, 40.7138],
                    [-74.0059, 40.7128]
                ]]
            },
            properties: {
                name: 'Building 1',
                type: 'office'
            }
        },
        {
            type: 'Feature',
            id: 'park-1',
            geometry: {
                type: 'Point',
                coordinates: [-74.0, 40.71]
            },
            properties: {
                name: 'Central Park',
                type: 'park'
            }
        }
    ]
};

console.log('Creating initial vector tile index...');
const tileIndex = geojsonvt(initialData, {debug: 1});

console.log('Initial tile at z0-0-0 has', tileIndex.getTile(0, 0, 0).features.length, 'features');

// Perform incremental updates
console.log('\nPerforming incremental updates...');

// Add a new building
tileIndex.updateFeatures([
    {
        action: 'add',
        feature: {
            type: 'Feature',
            id: 'building-2',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-74.0069, 40.7128],
                    [-74.0059, 40.7128],
                    [-74.0059, 40.7138], 
                    [-74.0069, 40.7138],
                    [-74.0069, 40.7128]
                ]]
            },
            properties: {
                name: 'Building 2',
                type: 'residential'
            }
        }
    }
]);

console.log('After adding building: tile has', tileIndex.getTile(0, 0, 0).features.length, 'features');

// Update an existing feature
tileIndex.updateFeatures([
    {
        action: 'update',
        featureId: 'building-1',
        feature: {
            type: 'Feature',
            id: 'building-1',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-74.0059, 40.7128],
                    [-74.0049, 40.7128],
                    [-74.0049, 40.7138],
                    [-74.0059, 40.7138],
                    [-74.0059, 40.7128]
                ]]
            },
            properties: {
                name: 'Building 1 - Renovated',
                type: 'office',
                renovated: true
            }
        }
    }
]);

console.log('After updating building: tile has', tileIndex.getTile(0, 0, 0).features.length, 'features');

// Remove a feature
tileIndex.updateFeatures([
    {
        action: 'remove',
        featureId: 'park-1'
    }
]);

console.log('After removing park: tile has', tileIndex.getTile(0, 0, 0).features.length, 'features');

// Batch multiple operations
tileIndex.updateFeatures([
    {
        action: 'add',
        feature: {
            type: 'Feature',
            id: 'road-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-74.006, 40.712],
                    [-74.005, 40.713]
                ]
            },
            properties: {
                name: 'Main Street',
                type: 'road'
            }
        }
    },
    {
        action: 'add', 
        feature: {
            type: 'Feature',
            id: 'park-2',
            geometry: {
                type: 'Point',
                coordinates: [-74.007, 40.714]
            },
            properties: {
                name: 'Pocket Park',
                type: 'park'
            }
        }
    }
]);

console.log('After batch operations: tile has', tileIndex.getTile(0, 0, 0).features.length, 'features');

console.log('\nFinal tile features:');
const finalTile = tileIndex.getTile(0, 0, 0);
finalTile.features.forEach((feature, i) => {
    console.log(`  ${i + 1}. ${feature.tags?.name || 'Unnamed'} (${feature.tags?.type || 'unknown'})`);
});