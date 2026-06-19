"""Simple contact manager using a doubly linked list and a hash table."""

from dataclasses import dataclass
from typing import Iterator, Optional


@dataclass(frozen=True)
class Contact:
    """A person's name and phone number."""

    name: str
    phone: str


class Node:
    """Node used by :class:`DoublyLinkedList`."""

    def __init__(self, contact: Contact) -> None:
        self.contact = contact
        self.prev: Optional[Node] = None
        self.next: Optional[Node] = None


class DoublyLinkedList:
    """Store contacts in insertion order and traverse in either direction."""

    def __init__(self) -> None:
        self.head: Optional[Node] = None
        self.tail: Optional[Node] = None

    def append(self, contact: Contact) -> None:
        new_node = Node(contact)

        if self.head is None:
            self.head = self.tail = new_node
            return

        assert self.tail is not None
        new_node.prev = self.tail
        self.tail.next = new_node
        self.tail = new_node

    def forward(self) -> Iterator[Contact]:
        current = self.head
        while current is not None:
            yield current.contact
            current = current.next

    def backward(self) -> Iterator[Contact]:
        current = self.tail
        while current is not None:
            yield current.contact
            current = current.prev


def contains_substring(text: str, keyword: str) -> bool:
    """Return whether *keyword* occurs in *text* using naive string matching."""

    if keyword == "":
        return True
    if len(keyword) > len(text):
        return False

    for start in range(len(text) - len(keyword) + 1):
        match = True
        for offset in range(len(keyword)):
            if text[start + offset] != keyword[offset]:
                match = False
                break
        if match:
            return True
    return False


class ContactManager:
    """Keep the same contacts in a linked list and a name-indexed dictionary."""

    def __init__(self) -> None:
        self.contacts = DoublyLinkedList()
        self.contacts_by_name: dict[str, Contact] = {}

    def add_contact(self, name: str, phone: str) -> Contact:
        name = name.strip()
        phone = phone.strip()
        if not name:
            raise ValueError("Name cannot be empty.")
        if not phone:
            raise ValueError("Phone cannot be empty.")

        key = name.casefold()
        if key in self.contacts_by_name:
            raise ValueError(f"A contact named '{name}' already exists.")

        contact = Contact(name, phone)
        self.contacts.append(contact)
        self.contacts_by_name[key] = contact
        return contact

    def search_by_name(self, name: str) -> Optional[Contact]:
        """Look up a complete name in average O(1) time."""

        return self.contacts_by_name.get(name.strip().casefold())

    def search_by_keyword(self, keyword: str) -> list[Contact]:
        """Find all names containing *keyword* (case-insensitive)."""

        normalized_keyword = keyword.casefold()
        return [
            contact
            for contact in self.contacts.forward()
            if contains_substring(contact.name.casefold(), normalized_keyword)
        ]

    def all_forward(self) -> list[Contact]:
        return list(self.contacts.forward())

    def all_backward(self) -> list[Contact]:
        return list(self.contacts.backward())


def print_contacts(contacts: list[Contact]) -> None:
    if not contacts:
        print("No contacts found.")
        return

    for contact in contacts:
        print(f"{contact.name} - {contact.phone}")


def main() -> None:
    manager = ContactManager()

    while True:
        print(
            "\n1. Add Contact\n"
            "2. Search by Keyword\n"
            "3. Search by Exact Name\n"
            "4. View All (Forward)\n"
            "5. View All (Backward)\n"
            "6. Exit\n"
        )
        option = input("Enter option: ").strip()

        if option == "1":
            name = input("Name: ")
            phone = input("Phone: ")
            try:
                manager.add_contact(name, phone)
                print("Contact added.")
            except ValueError as error:
                print(error)
        elif option == "2":
            matches = manager.search_by_keyword(input("Search keyword: "))
            if matches:
                for contact in matches:
                    print(f"Match found: {contact.name} - {contact.phone}")
            else:
                print("No matching contacts found.")
        elif option == "3":
            contact = manager.search_by_name(input("Name: "))
            if contact is None:
                print("Contact not found.")
            else:
                print(f"Contact found: {contact.name} - {contact.phone}")
        elif option == "4":
            print_contacts(manager.all_forward())
        elif option == "5":
            print_contacts(manager.all_backward())
        elif option == "6":
            print("Goodbye!")
            break
        else:
            print("Invalid option. Please enter a number from 1 to 6.")


if __name__ == "__main__":
    main()
