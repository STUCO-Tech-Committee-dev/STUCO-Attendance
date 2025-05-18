import membersCSV from './ALL_ELECTED.csv';

export const parseCSV = async () => {
    const text = await fetch(membersCSV).then(r => r.text());
    const lines = text.trim().split('\n').slice(1);
    const data = {};

    lines.forEach(line => {
        const [name, username, email] = line.split(',');
        if (!username) return;  // skip malformed lines
        const cleanUsername = username.trim().toLowerCase();
        data[cleanUsername] = {
            username: cleanUsername,
            name: name.trim(),
        };
    });

    return data;
};

