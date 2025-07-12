import test from 'node:test';
import assert from 'node:assert/strict';

import geojsonvt from '../src/index.js';

test('performance: incremental update vs recreation', () => {
    // Create a reasonably sized dataset
    const features = [];
    for (let i = 0; i < 1000; i++) {
        features.push({
            type: 'Feature',
            id: `feature-${i}`,
            geometry: {
                type: 'Point',
                coordinates: [Math.random() * 360 - 180, Math.random() * 180 - 90]
            },
            properties: {
                name: `Feature ${i}`,
                value: i
            }
        });
    }

    const initialData = {
        type: 'FeatureCollection',
        features
    };

    // Test full recreation time
    const recreationStart = performance.now();
    const index1 = geojsonvt(initialData);
    const originalTile = index1.getTile(0, 0, 0);
    const recreationTime = performance.now() - recreationStart;

    // Add a new feature to the existing features
    const newFeature = {
        type: 'Feature',
        id: 'new-feature',
        geometry: {
            type: 'Point',
            coordinates: [0, 0]
        },
        properties: {
            name: 'New Feature',
            value: 9999
        }
    };

    // Test incremental update time
    const index2 = geojsonvt(initialData);
    const updateStart = performance.now();
    index2.updateFeatures([{
        action: 'add',
        feature: newFeature
    }]);
    const updatedTile = index2.getTile(0, 0, 0);
    const updateTime = performance.now() - updateStart;

    // Verify correctness - the updated index should have more features than the original
    console.log(`Original features: ${originalTile.features.length}`);
    console.log(`Updated features: ${updatedTile.features.length}`);
    
    assert(originalTile.features.length > 0, 'Original tile should have features');
    assert(updatedTile.features.length > originalTile.features.length, 'Updated tile should have more features');

    // Performance comparison
    console.log(`Full recreation: ${recreationTime.toFixed(2)}ms`);
    console.log(`Incremental update: ${updateTime.toFixed(2)}ms`);

    // The incremental update should be significantly faster for small changes
    // Note: In this simplified implementation, we rebuild everything, but it's still
    // faster because we don't need to re-parse and re-convert the GeoJSON
    assert(updateTime < recreationTime,
        `Incremental update (${updateTime}ms) should be faster than recreation (${recreationTime}ms)`);
});

test('performance: multiple small updates vs single large update', () => {
    const initialData = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            id: 'base',
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            },
            properties: {name: 'base'}
        }]
    };

    // Test multiple small updates
    const index1 = geojsonvt(initialData);
    const multipleStart = performance.now();
    for (let i = 0; i < 10; i++) {
        index1.updateFeatures([{
            action: 'add',
            feature: {
                type: 'Feature',
                id: `small-${i}`,
                geometry: {
                    type: 'Point',
                    coordinates: [i, i]
                },
                properties: {name: `Small ${i}`}
            }
        }]);
    }
    const multipleTime = performance.now() - multipleStart;

    // Test single large update
    const index2 = geojsonvt(initialData);
    const changes = [];
    for (let i = 0; i < 10; i++) {
        changes.push({
            action: 'add',
            feature: {
                type: 'Feature',
                id: `batch-${i}`,
                geometry: {
                    type: 'Point',
                    coordinates: [i, i]
                },
                properties: {name: `Batch ${i}`}
            }
        });
    }
    const batchStart = performance.now();
    index2.updateFeatures(changes);
    const batchTime = performance.now() - batchStart;

    // Verify both have the same result
    const tile1 = index1.getTile(0, 0, 0);
    const tile2 = index2.getTile(0, 0, 0);
    assert.equal(tile1.features.length, 11); // base + 10 additions
    assert.equal(tile2.features.length, 11); // base + 10 additions

    console.log(`Multiple updates: ${multipleTime.toFixed(2)}ms`);
    console.log(`Batch update: ${batchTime.toFixed(2)}ms`);

    // Batch updates should generally be more efficient
    assert(batchTime <= multipleTime * 1.2, 
        'Batch updates should be competitive with multiple small updates');
});