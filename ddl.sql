--
CREATE TABLE star_message (
    original_id integer NOT NULL,
    reposted_id integer NOT NULL,
    CONSTRAINT star_message_pk PRIMARY KEY (original_id,reposted_id)
);
