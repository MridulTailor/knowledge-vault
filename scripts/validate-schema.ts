
import { buildASTSchema } from 'graphql';
import { typeDefs } from '../lib/graphql/schema';

try {
    buildASTSchema(typeDefs);
    console.log('Schema is valid!');
    process.exit(0);
} catch (error) {
    console.error('Schema validation failed:', error);
    process.exit(1);
}
