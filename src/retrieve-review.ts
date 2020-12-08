import SqlString from 'sqlstring';
import { getConnection } from './db/rds-ro';
import { ReviewMessage } from './review-message';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event): Promise<any> => {
	try {
		console.log('event aa', event);
		const mysql = await getConnection();
		const escape = SqlString.escape;
		const reviewId = event.pathParameters && event.pathParameters.proxy;
		console.log('reviewId', reviewId);
		const dbResults: readonly ReviewMessage[] = await mysql.query(
			`
			SELECT * FROM replay_summary 
			WHERE reviewId = ${escape(reviewId)}
		`,
		);
		// TODO: also merge with the other stats from the match_stats table, like is done in
		// the retrieve-user-match-stats API
		console.log('dbResults', dbResults);
		await mysql.end();

		const review = dbResults && dbResults.length > 0 ? dbResults[0] : null;
		console.log('review', review);
		const response = {
			statusCode: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
				'X-GAAAA': 'GLUT',
				'Access-Control-Allow-Methods': '*',
				'Access-Control-Allow-Credentials ': '*',
			},
			isBase64Encoded: false,
			body: JSON.stringify(review),
		};
		console.log('response', response);
		// console.log('sending back success reponse');
		return response;
	} catch (e) {
		console.error('issue retrieving review', e);
		const response = {
			statusCode: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
				'Access-Control-Allow-Methods': '*',
				'Access-Control-Allow-Credentials ': '*',
				'X-GAAAA': 'FAIL',
			},
			isBase64Encoded: false,
			body: JSON.stringify({ message: 'not ok', exception: e }),
		};
		console.log('sending back error reponse', response);
		return response;
	}
};
