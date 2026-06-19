import unittest

from contact_manager import ContactManager, contains_substring


class ContactManagerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.manager = ContactManager()
        self.alice = self.manager.add_contact("Alice", "1234567890")
        self.bob = self.manager.add_contact("Bob", "9876543210")
        self.alicia = self.manager.add_contact("Alicia", "5555555555")

    def test_contacts_are_stored_in_both_structures(self) -> None:
        self.assertIs(self.manager.contacts_by_name["alice"], self.alice)
        self.assertIs(self.manager.contacts.head.contact, self.alice)

    def test_forward_and_backward_order(self) -> None:
        self.assertEqual(
            [contact.name for contact in self.manager.all_forward()],
            ["Alice", "Bob", "Alicia"],
        )
        self.assertEqual(
            [contact.name for contact in self.manager.all_backward()],
            ["Alicia", "Bob", "Alice"],
        )

    def test_exact_name_lookup_is_case_insensitive(self) -> None:
        self.assertIs(self.manager.search_by_name("ALICE"), self.alice)
        self.assertIsNone(self.manager.search_by_name("Ali"))

    def test_keyword_search_is_case_insensitive(self) -> None:
        self.assertEqual(
            self.manager.search_by_keyword("ALI"), [self.alice, self.alicia]
        )

    def test_duplicate_names_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            self.manager.add_contact("alice", "111")

    def test_empty_fields_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            self.manager.add_contact("", "111")
        with self.assertRaises(ValueError):
            self.manager.add_contact("Charlie", "")


class NaiveSubstringTests(unittest.TestCase):
    def test_matching_and_non_matching_substrings(self) -> None:
        self.assertTrue(contains_substring("Alice", "lic"))
        self.assertTrue(contains_substring("Alice", ""))
        self.assertFalse(contains_substring("Alice", "Bob"))
        self.assertFalse(contains_substring("Al", "Alice"))


if __name__ == "__main__":
    unittest.main()
