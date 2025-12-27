CREATE INDEX "word_progress_user_id_idx" ON "flashcards"."word_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "word_progress_user_word_idx" ON "flashcards"."word_progress" USING btree ("user_id","word_english");--> statement-breakpoint
CREATE INDEX "word_progress_next_review_idx" ON "flashcards"."word_progress" USING btree ("next_review_date");--> statement-breakpoint
ALTER TABLE "flashcards"."users" DROP COLUMN "password";