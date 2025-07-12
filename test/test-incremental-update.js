import test from 'node:test';
import assert from 'node:assert/strict';

import geojsonvt from '../src/index.js';

test('incremental update: add features', () => {
    // Create initial index with one feature
    const initialData = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            },
            properties: {name: 'initial'}
        }]
    };

    const index = geojsonvt(initialData);
    const initialTile = index.getTile(0, 0, 0);

    assert.equal(initialTile.features.length, 1);
    assert.equal(initialTile.features[0].tags.name, 'initial');

    // Add a new feature in a different area
    const changes = [{
        action: 'add',
        feature: {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [90, 45]
            },
            properties: {name: 'added'}
        }
    }];

    index.updateFeatures(changes);

    // Verify the new feature is included
    const updatedTile = index.getTile(0, 0, 0);
    assert.equal(updatedTile.features.length, 2);

    const names = updatedTile.features.map(f => f.tags.name).sort();
    assert.deepEqual(names, ['added', 'initial']);
});

test('incremental update: remove features by ID', () => {
    const initialData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                id: 'keep-me',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                properties: {name: 'keep'}
            },
            {
                type: 'Feature',
                id: 'remove-me',
                geometry: {
                    type: 'Point',
                    coordinates: [1, 1]
                },
                properties: {name: 'remove'}
            }
        ]
    };

    const index = geojsonvt(initialData);
    const initialTile = index.getTile(0, 0, 0);
    assert.equal(initialTile.features.length, 2);

    // Remove the second feature
    const changes = [{
        action: 'remove',
        featureId: 'remove-me'
    }];

    index.updateFeatures(changes);

    const updatedTile = index.getTile(0, 0, 0);
    assert.equal(updatedTile.features.length, 1);
    assert.equal(updatedTile.features[0].tags.name, 'keep');
});

test('incremental update: update features by ID', () => {
    const initialData = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            id: 'update-me',
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            },
            properties: {name: 'original', value: 1}
        }]
    };

    const index = geojsonvt(initialData);
    const initialTile = index.getTile(0, 0, 0);
    assert.equal(initialTile.features[0].tags.value, 1);

    // Update the feature
    const changes = [{
        action: 'update',
        featureId: 'update-me',
        feature: {
            type: 'Feature',
            id: 'update-me',
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            },
            properties: {name: 'updated', value: 2}
        }
    }];

    index.updateFeatures(changes);

    const updatedTile = index.getTile(0, 0, 0);
    assert.equal(updatedTile.features.length, 1);
    assert.equal(updatedTile.features[0].tags.name, 'updated');
    assert.equal(updatedTile.features[0].tags.value, 2);
});

test('incremental update: empty changes', () => {
    const initialData = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            },
            properties: {name: 'test'}
        }]
    };

    const index = geojsonvt(initialData);
    const initialTileCount = Object.keys(index.tiles).length;

    // Update with empty changes
    index.updateFeatures([]);

    // Should not change anything
    assert.equal(Object.keys(index.tiles).length, initialTileCount);
    const tile = index.getTile(0, 0, 0);
    assert.equal(tile.features.length, 1);
    assert.equal(tile.features[0].tags.name, 'test');
});

test('incremental update: multiple operations', () => {
    // Create initial index with multiple features
    const initialData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                id: 'feature-1',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                properties: {name: 'first'}
            },
            {
                type: 'Feature',
                id: 'feature-2',
                geometry: {
                    type: 'Point',
                    coordinates: [10, 10]
                },
                properties: {name: 'second'}
            }
        ]
    };

    const index = geojsonvt(initialData);
    let tile = index.getTile(0, 0, 0);
    assert.equal(tile.features.length, 2);

    // Perform multiple operations
    const changes = [
        {
            action: 'remove',
            featureId: 'feature-2'
        },
        {
            action: 'add',
            feature: {
                type: 'Feature',
                id: 'feature-3',
                geometry: {
                    type: 'Point',
                    coordinates: [20, 20]
                },
                properties: {name: 'third'}
            }
        },
        {
            action: 'update',
            featureId: 'feature-1',
            feature: {
                type: 'Feature',
                id: 'feature-1',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0]
                },
                properties: {name: 'first-updated'}
            }
        }
    ];

    index.updateFeatures(changes);

    tile = index.getTile(0, 0, 0);
    assert.equal(tile.features.length, 2);

    const names = tile.features.map(f => f.tags.name).sort();
    assert.deepEqual(names, ['first-updated', 'third']);
});
