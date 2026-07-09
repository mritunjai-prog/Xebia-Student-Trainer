package com.xebia.portal.service;

import com.xebia.portal.entity.User;

public interface CurrentUserService {
    User requireCurrentUser();
}
