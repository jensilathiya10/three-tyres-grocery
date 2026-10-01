-- CreateTable
CREATE TABLE "ClosedDay" (
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ClosedDay_pkey" PRIMARY KEY ("date")
);
