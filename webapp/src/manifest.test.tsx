// Copyright (c) 2025-present Andrii Miroshnychenko. All Rights Reserved.
// See LICENSE.txt for license information.

import manifest from './manifest';

test('Plugin manifest, id and version are defined', () => {
    expect(manifest).toBeDefined();
    expect(manifest.id).toBeDefined();
    expect(manifest.version).toBeDefined();
});
