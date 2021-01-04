import { copyContent, endpoints } from 'shared/data';

import {
  characterCountAlias,
  characterCountOperationName,
  charactersByIdAlias,
  charactersByIdOperationName,
  mockCharacterData,
  mockCharacterCountResponse,
  mockCharactersByIdResponse,
  mockCharacterDescription,
} from 'cypress/fixtures/get-rick-and-morty-charater.mock';

const { getCharacterButton } = copyContent.landingPage;

describe('Get Rick and Morty Character', () => {
  before(() => {
    /**
     * Here we intercept the two GQL calls that are made.
     * Because GQL has one endpoint, we use a pair of if blocks
     * to determine each call by the request's operation name.
     * When the request is identified, we add an alias in Cypress
     * to the request and mock the response for consistent results.
     */
    cy.intercept(endpoints.graphql, req => {
      const { operationName } = req.body;

      // This is the initial character count request
      if (operationName === characterCountOperationName) {
        req.alias = characterCountAlias;
        req.reply(res => {
          // The mocked response says there is only 1 character,
          // which lets us consistently receive the first character, Rick
          res.body = mockCharacterCountResponse;
        });
      }

      // This is the characters by ids request
      if (operationName === charactersByIdOperationName) {
        req.alias = charactersByIdAlias;
        // The mocked response consistently returns Rick's data.
        // Even though we're forcing the actual API to return Rick's data
        // every time, this allows us to ensure the data returned from this
        // request is consistent, even if the API is down.
        req.reply(res => {
          res.body = mockCharactersByIdResponse;
        });
      }
    });

    // Once the intercepts are in place, we visit the landing page
    cy.visit('/');

    // And wait for the character count request before running any tests
    cy.wait(`@${characterCountAlias}`);
  });

  it('Should show a loading circle when the button is clicked', () => {
    // Click the character button
    cy.findByText(getCharacterButton).click();

    // Ensure the loader is present by className
    // Usually we would check by a more contextual value, but for
    // something like a loader, this type of check is okay
    cy.get('.fd-circle-loader').should('exist');
  });

  it("Should show the character's number, name, species, and picture", () => {
    // Use the mock data to check Rick's description
    cy.findByText(mockCharacterDescription).should('exist');
  });

  it('Should show a picture of the character', () => {
    // Grab Rick's image by the alt attribute
    // We use a ().then chain here to capture the value of the image element
    // to be used in multiple checks.
    // Read more here: https://docs.cypress.io/guides/core-concepts/variables-and-aliases.html#Return-Values
    cy.findByAltText(mockCharacterData.name).then($characterImage => {
      // Check that it exists and that the src attribute matches the mock data
      $characterImage.should('exist');
      // Because we're using a ().then chain, the assertions here follow the
      // Chair Assertion Library, not Cypress
      $characterImage.should.have.attr('src', mockCharacterData.image);
    });
  });
});
