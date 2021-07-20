package com.trade.upbittrading.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/")
@Log4j2
public class MainController {
    @GetMapping("/")
    public String home() {
        log.info("load home..........");

        return "home";
    }
}
