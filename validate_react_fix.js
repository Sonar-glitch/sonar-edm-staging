/**
 * 🚨 CRITICAL VALIDATION SCRIPT
 * Tests React Error #31 fix for venue object structure normalization
 */

const testReactFix = async () => {
    const baseUrl = 'https://sonar-edm-staging-ef96efd71e8e.herokuapp.com';
    
    console.log('🚨 Testing React Error #31 Fix...\n');
    
    try {
        // Test the events API directly to check venue structure
        console.log('🔍 1. Testing Events API venue structure...');
        const eventsResponse = await fetch(`${baseUrl}/api/events?city=Montreal&userId=test_validation`);
        const eventsData = await eventsResponse.json();
        
        console.log('✅ Events API Status:', eventsResponse.status);
        console.log('📊 Events Count:', eventsData.events?.length || 0);
        
        if (eventsData.events && eventsData.events.length > 0) {
            const sampleEvent = eventsData.events[0];
            console.log('\n🏢 Sample Event Venue Structure:');
            console.log('  - venue (string):', typeof sampleEvent.venue, '=', sampleEvent.venue);
            console.log('  - location (string):', typeof sampleEvent.location, '=', sampleEvent.location);
            
            if (sampleEvent.venues && sampleEvent.venues[0]) {
                const venueObj = sampleEvent.venues[0];
                console.log('  - venues[0] structure:');
                console.log('    * name:', typeof venueObj.name, '=', venueObj.name);
                console.log('    * address:', typeof venueObj.address, '=', venueObj.address);
                console.log('    * city:', typeof venueObj.city, '=', venueObj.city);
                console.log('    * state:', typeof venueObj.state, '=', venueObj.state);
                console.log('    * country:', typeof venueObj.country, '=', venueObj.country);
                console.log('    * type:', typeof venueObj.type, '=', venueObj.type);
                console.log('    * capacity:', typeof venueObj.capacity, '=', venueObj.capacity);
                console.log('    * url:', typeof venueObj.url, '=', venueObj.url);
                
                // Check for consistency
                const hasConsistentStructure = [
                    typeof venueObj.name === 'string',
                    typeof venueObj.address === 'string',
                    typeof venueObj.city === 'string',
                    typeof venueObj.state === 'string',
                    typeof venueObj.country === 'string',
                    typeof venueObj.type === 'string',
                    typeof venueObj.url === 'string'
                ].every(check => check === true);
                
                console.log('✅ Venue structure consistent:', hasConsistentStructure ? 'YES' : 'NO');
            }
        }
        
        // Test multiple events to ensure consistency
        console.log('\n🔍 2. Testing multiple events for consistency...');
        let structureConsistent = true;
        let structureErrors = [];
        
        if (eventsData.events) {
            eventsData.events.slice(0, 5).forEach((event, index) => {
                if (event.venues && event.venues[0]) {
                    const venue = event.venues[0];
                    const requiredStringFields = ['name', 'address', 'city', 'state', 'country', 'type', 'url'];
                    
                    requiredStringFields.forEach(field => {
                        if (typeof venue[field] !== 'string') {
                            structureConsistent = false;
                            structureErrors.push(`Event ${index}: venue.${field} is ${typeof venue[field]}, expected string`);
                        }
                    });
                }
            });
        }
        
        console.log('✅ All venues consistent:', structureConsistent ? 'YES' : 'NO');
        if (!structureConsistent) {
            console.log('❌ Structure Errors:');
            structureErrors.forEach(error => console.log(`  - ${error}`));
        }
        
        // Test cache system
        console.log('\n🔍 3. Testing cache system...');
        const cacheResponse = await fetch(`${baseUrl}/api/user/cache-status`);
        const cacheData = await cacheResponse.json();
        
        console.log('✅ Cache Status:', cacheResponse.status);
        console.log('💾 Profiles Cached:', cacheData.profilesCached || 0);
        console.log('⏰ TTL Index Active:', cacheData.ttlIndexActive);
        
        return {
            apiWorking: eventsResponse.status === 200,
            eventsFound: eventsData.events?.length > 0,
            venueStructureFixed: structureConsistent,
            cacheWorking: cacheResponse.status === 200,
            overallStatus: eventsResponse.status === 200 && structureConsistent
        };
        
    } catch (error) {
        console.error('❌ Validation Error:', error.message);
        return {
            apiWorking: false,
            eventsFound: false,
            venueStructureFixed: false,
            cacheWorking: false,
            overallStatus: false,
            error: error.message
        };
    }
};

// Run validation
testReactFix().then(results => {
    console.log('\n🎯 VALIDATION RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ API Working:', results.apiWorking ? 'YES' : 'NO');
    console.log('✅ Events Found:', results.eventsFound ? 'YES' : 'NO');
    console.log('✅ Venue Structure Fixed:', results.venueStructureFixed ? 'YES' : 'NO');
    console.log('✅ Cache Working:', results.cacheWorking ? 'YES' : 'NO');
    
    if (results.error) {
        console.log('❌ Error Details:', results.error);
    }
    
    const status = results.overallStatus ? '🎉 FIXED' : '⚠️ ISSUES REMAIN';
    console.log('\n🚨 REACT ERROR #31 STATUS:', status);
    
    if (results.overallStatus) {
        console.log('\n🎉 React crashes should be resolved!');
        console.log('📋 Next Steps:');
        console.log('  1. ✅ Venue objects now have consistent structure');
        console.log('  2. ✅ All properties are properly typed strings');
        console.log('  3. ✅ Events API working correctly');
        console.log('  4. 🔄 Dashboard should load without infinite errors');
        console.log('  5. 🎯 Ready for Phase 2: Essentia integration');
    } else {
        console.log('\n⚠️ Additional fixes may be needed.');
    }
});
