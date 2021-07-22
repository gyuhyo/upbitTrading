package com.trade.upbittrading.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/mock/")
public class MockInvestController {

    @GetMapping("/mock_invest")
    public void mock_invest() {

    }
}
