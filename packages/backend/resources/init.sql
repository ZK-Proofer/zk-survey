-- ZK Survey System Database Schema
use zk_survey;

-- Members (Survey Creators)
CREATE TABLE `members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nickname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_members_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Surveys (Main Survey Information)
CREATE TABLE `surveys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `author_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('DRAFT', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_surveys_author_id` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Questions (Survey Questions)
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `text` text NOT NULL,
  `type` enum('TEXT', 'MULTIPLE_CHOICE', 'RATING') NOT NULL DEFAULT 'TEXT',
  `order_index` int NOT NULL DEFAULT 0,
  `is_required` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_questions_survey_id` (`survey_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question Options (For Multiple Choice Questions)
CREATE TABLE `question_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `text` varchar(255) NOT NULL,
  `order_index` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_question_options_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Survey Invitations (Email Distribution - No Password)
CREATE TABLE `survey_invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `uuid` varchar(36) NOT NULL,
  `status` enum('PENDING', 'SENT', 'OPENED') NOT NULL DEFAULT 'PENDING',
  `sent_at` timestamp NULL,
  `opened_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invitations_uuid` (`uuid`),
  KEY `idx_invitations_survey_id` (`survey_id`),
  KEY `idx_invitations_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commitments (ZK Proof Commitments - No Password in DB)
CREATE TABLE `commitments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invitation_id` int NOT NULL,
  `uuid` varchar(36) NOT NULL,
  `commitment_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_commitments_hash` (`commitment_hash`),
  KEY `idx_commitments_invitation_id` (`invitation_id`),
  KEY `idx_commitments_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Survey Responses (Anonymous Submissions - No Email Link)
CREATE TABLE `survey_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `nullifier_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_responses_nullifier` (`nullifier_hash`),
  KEY `idx_responses_survey_id` (`survey_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Response Answers (Individual Question Answers)
CREATE TABLE `response_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `response_id` int NOT NULL,
  `question_id` int NOT NULL,
  `answer_text` text,
  `selected_option_id` int NULL,
  `rating_value` int NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_answers_response_id` (`response_id`),
  KEY `idx_answers_question_id` (`question_id`),
  KEY `idx_answers_selected_option_id` (`selected_option_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification Records (ZK Proof Verification)
CREATE TABLE `verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `response_id` int NOT NULL,
  `nullifier_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_verifications_response` (`response_id`),
  KEY `idx_verifications_response_id` (`response_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Additional Indexes for Performance
CREATE INDEX `idx_surveys_status` ON `surveys` (`status`);
CREATE INDEX `idx_surveys_created_at` ON `surveys` (`created_at`);
CREATE INDEX `idx_questions_order` ON `questions` (`survey_id`, `order_index`);
CREATE INDEX `idx_invitations_status` ON `survey_invitations` (`status`);

-- Merkle Tree
CREATE TABLE `merkle_tree` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `survey_id` int NOT NULL,
  `depth` int NOT NULL,
  `leaves` mediumtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

