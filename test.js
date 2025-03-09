console.log('Testing Airtable:', typeof Airtable);
if (typeof Airtable !== 'undefined') {
    const airtable = new Airtable({ apiKey: 'patFtSWH6rXymvmio.c4b5cf40de13b1c3f8468c169a391dd4bfd49bb4d0079220875703ff5affe7c3' });
    console.log('Airtable initialized:', airtable);
} else {
    console.error('Airtable is not defined');
}