-- MariaDB DDL for InstaClone 2

-- Create Database (Optional, commented out)
-- CREATE DATABASE IF NOT EXISTS insta_clone;
-- USE insta_clone;

-- 1. Member Table
CREATE TABLE `Member` (
    `userKey` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK, 유저 고유 키',
    `userID` VARCHAR(50) NOT NULL UNIQUE COMMENT '유저 아이디',
    `userPW` VARCHAR(255) NOT NULL COMMENT '유저 비밀번호'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='회원 정보';

-- 2. Post Table
CREATE TABLE `Post` (
    `postKey` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK, 게시글 고유 키',
    `userKey` INT NOT NULL COMMENT 'FK, 작성자 키',
    `userID` VARCHAR(50) NOT NULL COMMENT '작성자 아이디 (Redundant for optimized read, or remove if strict normalization)',
    `postingDate` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '게시 날짜',
    `photoSrc` VARCHAR(255) COMMENT '사진 경로',
    `content` TEXT COMMENT '게시글 내용',
    CONSTRAINT `FK_Post_Member` FOREIGN KEY (`userKey`) REFERENCES `Member` (`userKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='게시글';

-- 3. Profile Table
CREATE TABLE `Profile` (
    `userKey` INT PRIMARY KEY COMMENT 'PK/FK, 유저 고유 키',
    `profilePhotoSrc` VARCHAR(255) COMMENT '프로필 사진 경로',
    `profileContent` TEXT COMMENT '프로필 소개글',
    CONSTRAINT `FK_Profile_Member` FOREIGN KEY (`userKey`) REFERENCES `Member` (`userKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='프로필';

-- 4. Comment Table
CREATE TABLE `Comment` (
    `commentKey` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK, 댓글 고유 키',
    `postKey` INT NOT NULL COMMENT 'FK, 게시글 키',
    `parentKey` INT DEFAULT 0 COMMENT '대댓글인 경우 부모 댓글 키 (Default 0)',
    `depth` INT DEFAULT 0 COMMENT '댓글 깊이',
    `userKey` INT NOT NULL COMMENT 'FK, 작성자 키',
    `userID` VARCHAR(50) NOT NULL COMMENT '작성자 아이디',
    `commentDate` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '댓글 작성 날짜',
    `content` TEXT NOT NULL COMMENT '댓글 내용',
    CONSTRAINT `FK_Comment_Post` FOREIGN KEY (`postKey`) REFERENCES `Post` (`postKey`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_Comment_Member` FOREIGN KEY (`userKey`) REFERENCES `Member` (`userKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='댓글';

-- 5. Like Table (Likes)
-- Note: 'likeUserList' from the logical schema is implemented as a relational mapping table.
CREATE TABLE `Likes` (
    `postKey` INT NOT NULL COMMENT 'FK, 게시글 키',
    `userKey` INT NOT NULL COMMENT 'FK, 유저 키',
    PRIMARY KEY (`postKey`, `userKey`),
    CONSTRAINT `FK_Likes_Post` FOREIGN KEY (`postKey`) REFERENCES `Post` (`postKey`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_Likes_Member` FOREIGN KEY (`userKey`) REFERENCES `Member` (`userKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='좋아요 (게시글-유저 매핑)';
