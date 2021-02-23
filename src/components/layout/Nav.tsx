import React from "react";
import { routes } from "../../constants";
import { Box, Button, Flex, Link } from "rimble-ui";
import { colors } from "serto-ui";
import { SertoSearchIcon } from "../elements";
import { Viewport } from "./";
import { Search } from "../../views/Search/Search";

export interface NavLinkProps {
  href: string;
}

export const NavLink: React.FunctionComponent<NavLinkProps> = (props) => {
  return (
    <Link href={props.href} color={colors.primary.base} fontWeight={2} mr={4}>
      {props.children}
    </Link>
  );
};

export const Nav: React.FunctionComponent = () => {
  return (
    <Box bg={colors.primary.border} position="fixed" top="0" width="100%" zIndex="1">
      <Viewport>
        <Flex alignItems="center" height="72px" justifyContent="space-between">
          <SertoSearchIcon />
          <Flex alignItems="center">
            <NavLink href={routes.HOW_IT_WORKS}>How it works</NavLink>
            <Box width="500px">
              <Search />
            </Box>
          </Flex>
          <Flex alignItems="center">
            <NavLink href={routes.LOGIN}>Login</NavLink>
            <Button as="a" href={routes.JOIN}>
              Join Free
            </Button>
          </Flex>
        </Flex>
      </Viewport>
    </Box>
  );
};
