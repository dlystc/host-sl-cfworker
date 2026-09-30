import { OpenAPIRoute, contentJson } from "chanfana";
import { z } from "zod";
import { AppContext } from "../../types/context";
import { getNeonConnection, getSentences, SentenceEntry } from "../../db";

export class DebugGetSentences extends OpenAPIRoute {
	schema = {
		tags: ["Sentences", "Debug"],
		summary: "Debug: Get some sentences from db",
		request: {
			query: z.object({
				count: z.coerce.number().default(200).describe('Count of sentences'),
			}),
		},
		responses: {
			"200": {
				description: "Returns a list of sentence entries",
				...contentJson(z.object({
					success: z.boolean(),
					sentences: z.array(z.object({
						content: z.string(),
						source: z.string().nullable(),
						author: z.string().nullable(),
						created_at: z.string().nullable(),
					})),
				})),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { count } = data.query;

		const conn = getNeonConnection();

		return {
			success: true,
			sentences: await getSentences(conn, count) as SentenceEntry[],
		};
	}
}