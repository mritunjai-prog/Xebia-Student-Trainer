package com.xebia.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "user_settings")
public class UserSettings {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 20)
    private String theme = "light";

    private boolean notifyPush = true;
    private boolean notifyGraded = true;
    private boolean notifyDeadline = true;
    private boolean soundEffects = true;

    @Column(length = 40)
    private String language = "English";
}
