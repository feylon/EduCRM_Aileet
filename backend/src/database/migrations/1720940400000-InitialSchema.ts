import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1720940400000 implements MigrationInterface {
  name = 'InitialSchema1720940400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'teacher', 'student')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "phone" character varying(20), "password_hash" character varying NOT NULL, "role" "public"."user_role" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "language" character varying(5) NOT NULL DEFAULT 'uz', "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_active" ON "users" ("email") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."course_level" AS ENUM('beginner', 'elementary', 'intermediate', 'advanced')`,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(150) NOT NULL, "description" text, "price" numeric(12,2) NOT NULL, "duration_months" integer NOT NULL DEFAULT '3', "lessons_per_week" integer NOT NULL DEFAULT '3', "level" "public"."course_level" NOT NULL DEFAULT 'beginner', "color" character varying(7) NOT NULL DEFAULT '#6366f1', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_courses_name_active" ON "courses" ("name") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "group_id" uuid NOT NULL, "day_of_week" smallint NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "room" character varying(50), CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_330dc11fecc87ead6c8464d955" ON "schedules" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_231f03d87ddff60c2328637308" ON "schedules" ("day_of_week", "start_time") `,
    );
    await queryRunner.query(
      `CREATE TABLE "teachers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "specialization" character varying(150), "bio" text, "experience_years" integer NOT NULL DEFAULT '0', "hire_date" date, "salary" numeric(12,2), CONSTRAINT "REL_4668d4752e6766682d1be0b346" UNIQUE ("user_id"), CONSTRAINT "PK_a8d4f83be3abe4c687b0a0093c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_status" AS ENUM('planned', 'active', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(100) NOT NULL, "course_id" uuid NOT NULL, "teacher_id" uuid, "room" character varying(50), "start_date" date NOT NULL, "end_date" date, "status" "public"."group_status" NOT NULL DEFAULT 'planned', "max_students" integer NOT NULL DEFAULT '15', CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b61a35e72ff621fcd717d74fce" ON "groups" ("course_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9703f1aa2b5ae1000816cf385" ON "groups" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_479d3d96102ea6e80113503c68" ON "groups" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_student_status" AS ENUM('active', 'left')`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "group_id" uuid NOT NULL, "student_id" uuid NOT NULL, "joined_at" date NOT NULL DEFAULT ('now'::text)::date, "left_at" date, "status" "public"."group_student_status" NOT NULL DEFAULT 'active', CONSTRAINT "UQ_group_students_group_student" UNIQUE ("group_id", "student_id"), CONSTRAINT "PK_cd596d1c8176853f748dc44af4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86ac11b05c01e9981dd4e4ba39" ON "group_students" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'transfer', 'click', 'payme')`,
    );
    await queryRunner.query(`CREATE TYPE "public"."payment_status" AS ENUM('paid', 'refunded')`);
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "student_id" uuid NOT NULL, "group_id" uuid, "amount" numeric(12,2) NOT NULL, "method" "public"."payment_method" NOT NULL DEFAULT 'cash', "status" "public"."payment_status" NOT NULL DEFAULT 'paid', "paid_at" date NOT NULL DEFAULT ('now'::text)::date, "for_month" character(7) NOT NULL, "note" character varying(255), "received_by_id" uuid, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9fd5d6ef620b0140a67ff2d95c" ON "payments" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_921c6d19b1de7071743a06f50f" ON "payments" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7848ab97e1ac9dddf781103de5" ON "payments" ("paid_at") `,
    );
    await queryRunner.query(`CREATE TYPE "public"."gender" AS ENUM('male', 'female')`);
    await queryRunner.query(
      `CREATE TYPE "public"."student_status" AS ENUM('active', 'frozen', 'graduated', 'left')`,
    );
    await queryRunner.query(
      `CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "birth_date" date, "gender" "public"."gender", "parent_name" character varying(150), "parent_phone" character varying(20), "address" character varying(255), "status" "public"."student_status" NOT NULL DEFAULT 'active', "enrolled_at" date NOT NULL DEFAULT ('now'::text)::date, "notes" text, CONSTRAINT "REL_fb3eff90b11bddf7285f9b4e28" UNIQUE ("user_id"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_89d97b30d7d2b126c22e4fb28d" ON "students" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type" AS ENUM('announcement', 'payment_received', 'absence', 'lead_assigned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "type" "public"."notification_type" NOT NULL, "title" character varying(200), "message" text, "data" jsonb, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_af08fad7c04bb85403970afdc1" ON "notifications" ("user_id", "is_read") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lead_source" AS ENUM('instagram', 'telegram', 'facebook', 'website', 'referral', 'phone_call', 'walk_in', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'trial', 'converted', 'lost')`,
    );
    await queryRunner.query(
      `CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "full_name" character varying(150) NOT NULL, "phone" character varying(20) NOT NULL, "email" character varying(150), "source" "public"."lead_source" NOT NULL DEFAULT 'other', "status" "public"."lead_status" NOT NULL DEFAULT 'new', "course_id" uuid, "assigned_to_id" uuid, "note" text, "next_contact_at" TIMESTAMP WITH TIME ZONE, "lost_reason" character varying(255), "converted_student_id" uuid, "converted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_e007dc02174396125a94817987" UNIQUE ("converted_student_id"), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_42ebb4366d014febbcfdef39e3" ON "leads" ("phone") `);
    await queryRunner.query(`CREATE INDEX "IDX_491b018d616822bd64ce7d4726" ON "leads" ("status") `);
    await queryRunner.query(
      `CREATE TABLE "lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "group_id" uuid NOT NULL, "date" date NOT NULL, "topic" character varying(255), "homework" text, "teacher_id" uuid, CONSTRAINT "UQ_lessons_group_date" UNIQUE ("group_id", "date"), CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_5c441a71bcb99a93b949ad2eb5" ON "lessons" ("date") `);
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lesson_id" uuid NOT NULL, "student_id" uuid NOT NULL, "status" "public"."attendance_status" NOT NULL, "note" character varying(255), "marked_by_id" uuid, CONSTRAINT "UQ_attendances_lesson_student" UNIQUE ("lesson_id", "student_id"), CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7874d0af5c1371ad4ea2152e26" ON "attendances" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_69fb1c5e3dc1d2f3171f6e6025" ON "attendances" ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "teacher_courses" ("teacher_id" uuid NOT NULL, "course_id" uuid NOT NULL, CONSTRAINT "PK_441de53f6d19f1493632b1f6286" PRIMARY KEY ("teacher_id", "course_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d37543187a5faa1e58956bacec" ON "teacher_courses" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee876e2b6462fc2833ab970335" ON "teacher_courses" ("course_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_330dc11fecc87ead6c8464d9552" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" ADD CONSTRAINT "FK_4668d4752e6766682d1be0b346f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD CONSTRAINT "FK_b61a35e72ff621fcd717d74fce6" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD CONSTRAINT "FK_e9703f1aa2b5ae1000816cf385d" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_students" ADD CONSTRAINT "FK_8b5b7bb7e2c2f1a8e4319ae3394" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_students" ADD CONSTRAINT "FK_86ac11b05c01e9981dd4e4ba39e" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_9fd5d6ef620b0140a67ff2d95c4" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_921c6d19b1de7071743a06f50fc" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_fdb95dd85ac02027afaed80f139" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_2445eb0e7908078200edd2a9293" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_c4b8fc50cc732d8a6edff3a6d80" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_e007dc02174396125a948179874" FOREIGN KEY ("converted_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "FK_0a55df52bea3eec58e4a86e40f7" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "FK_91eb3280b50fe17091b191bbd98" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" ADD CONSTRAINT "FK_07d5e8f2494c5e7d7abf7eb5fec" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" ADD CONSTRAINT "FK_7874d0af5c1371ad4ea2152e266" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" ADD CONSTRAINT "FK_b3f9d25af79678c6ec384caaf82" FOREIGN KEY ("marked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_courses" ADD CONSTRAINT "FK_d37543187a5faa1e58956bacec1" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_courses" ADD CONSTRAINT "FK_ee876e2b6462fc2833ab9703359" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "teacher_courses" DROP CONSTRAINT "FK_ee876e2b6462fc2833ab9703359"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_courses" DROP CONSTRAINT "FK_d37543187a5faa1e58956bacec1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" DROP CONSTRAINT "FK_b3f9d25af79678c6ec384caaf82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" DROP CONSTRAINT "FK_7874d0af5c1371ad4ea2152e266"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" DROP CONSTRAINT "FK_07d5e8f2494c5e7d7abf7eb5fec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT "FK_91eb3280b50fe17091b191bbd98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT "FK_0a55df52bea3eec58e4a86e40f7"`,
    );
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_e007dc02174396125a948179874"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_c4b8fc50cc732d8a6edff3a6d80"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_2445eb0e7908078200edd2a9293"`);
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_fdb95dd85ac02027afaed80f139"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_921c6d19b1de7071743a06f50fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_9fd5d6ef620b0140a67ff2d95c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_students" DROP CONSTRAINT "FK_86ac11b05c01e9981dd4e4ba39e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_students" DROP CONSTRAINT "FK_8b5b7bb7e2c2f1a8e4319ae3394"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP CONSTRAINT "FK_e9703f1aa2b5ae1000816cf385d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP CONSTRAINT "FK_b61a35e72ff621fcd717d74fce6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" DROP CONSTRAINT "FK_4668d4752e6766682d1be0b346f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "FK_330dc11fecc87ead6c8464d9552"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ee876e2b6462fc2833ab970335"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d37543187a5faa1e58956bacec"`);
    await queryRunner.query(`DROP TABLE "teacher_courses"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_69fb1c5e3dc1d2f3171f6e6025"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7874d0af5c1371ad4ea2152e26"`);
    await queryRunner.query(`DROP TABLE "attendances"`);
    await queryRunner.query(`DROP TYPE "public"."attendance_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5c441a71bcb99a93b949ad2eb5"`);
    await queryRunner.query(`DROP TABLE "lessons"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_491b018d616822bd64ce7d4726"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_42ebb4366d014febbcfdef39e3"`);
    await queryRunner.query(`DROP TABLE "leads"`);
    await queryRunner.query(`DROP TYPE "public"."lead_status"`);
    await queryRunner.query(`DROP TYPE "public"."lead_source"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_af08fad7c04bb85403970afdc1"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notification_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_89d97b30d7d2b126c22e4fb28d"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TYPE "public"."student_status"`);
    await queryRunner.query(`DROP TYPE "public"."gender"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7848ab97e1ac9dddf781103de5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_921c6d19b1de7071743a06f50f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9fd5d6ef620b0140a67ff2d95c"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payment_status"`);
    await queryRunner.query(`DROP TYPE "public"."payment_method"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_86ac11b05c01e9981dd4e4ba39"`);
    await queryRunner.query(`DROP TABLE "group_students"`);
    await queryRunner.query(`DROP TYPE "public"."group_student_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_479d3d96102ea6e80113503c68"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e9703f1aa2b5ae1000816cf385"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b61a35e72ff621fcd717d74fce"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TYPE "public"."group_status"`);
    await queryRunner.query(`DROP TABLE "teachers"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_231f03d87ddff60c2328637308"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_330dc11fecc87ead6c8464d955"`);
    await queryRunner.query(`DROP TABLE "schedules"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_courses_name_active"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TYPE "public"."course_level"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_users_email_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
  }
}
